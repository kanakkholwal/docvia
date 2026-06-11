// biome-ignore-all lint/suspicious/noExplicitAny: Vite plugin hook context and source-map shapes are intentionally loose passthroughs.
// The `docvia()` Vite plugin — runs the markdown compiler in-process.
//
// No separate `docvia build` step: in dev it instantiates a CompileService,
// serves `docvia/source` as a virtual module, watches the source tree, and
// recompiles incrementally; in build it emits the on-disk module graph.

import { resolve } from "node:path";
import { parseMarkdown } from "@docvia/core";
import type { docviaConfig, IRDocument, RendererAdapter } from "@docvia/ir";
import { docviaError, transformToIR } from "@docvia/ir";
import { CompileService } from "@docvia/runtime";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";
import type { HmrContext, Plugin, ViteDevServer } from "vite";

const SOURCE_IDS = new Set(["docvia/source", "docvia:source", "docvia-source"]);
const BROWSER_SOURCE_IDS = new Set([
	"docvia/source/browser",
	"docvia:source/browser",
]);
const VIRTUAL_SOURCE_ID = "\0docvia:virtual-source";
const VIRTUAL_BROWSER_ID = "\0docvia:virtual-browser";

export interface DocviaVitePluginOptions {
	/** Force a full rebuild, ignoring the incremental cache. Default: false. */
	readonly noCache?: boolean;
}

/** Shape a compile error into a Vite HMR error-overlay payload. */
function toErrorPayload(err: unknown): { message: string; stack: string } {
	if (err instanceof docviaError) {
		const where = err.file ? ` (${err.file})` : "";
		return {
			message: `[docvia ${err.code}] ${err.message}${where}`,
			stack: err.stack ?? "",
		};
	}
	return {
		message: err instanceof Error ? err.message : String(err),
		stack: err instanceof Error ? (err.stack ?? "") : "",
	};
}

/**
 * The docvia Vite plugin. Compiles markdown alongside the dev server — no
 * separate `docvia build` step. In dev `docvia/source` is a virtual module
 * regenerated on every source change; in build the on-disk module graph is
 * emitted instead.
 */
export function docvia(
	config: docviaConfig,
	options: DocviaVitePluginOptions = {},
): Plugin {
	if (!config.renderer) {
		throw new Error("[docvia] No renderer configured in docvia config");
	}
	// Explicitly typed so the value stays non-optional inside nested closures.
	const renderer: RendererAdapter = config.renderer;

	let root = process.cwd();
	let isDev = false;
	let service: CompileService | null = null;
	let ready: Promise<void> | null = null;

	function createService(): CompileService {
		return new CompileService({
			sourceDir: config.sourceDir,
			outDir: config.outDir,
			renderer,
			plugins: [...config.plugins],
			config,
			projectRoot: root,
			incremental: !options.noCache,
		});
	}

	/** Compile everything; emit the disk graph (build) or just IDE types (dev). */
	async function initialCompile(): Promise<void> {
		const svc = createService();
		await svc.compileAll();
		if (isDev) {
			await svc.emitTypeDeclarations();
		} else {
			await svc.emitDiskModuleGraph();
		}
		service = svc;
	}

	async function toIR(code: string, filePath: string): Promise<IRDocument> {
		// Prefer the service's IR so dev output matches the build pipeline
		// (plugin hooks + build-time highlighting all applied).
		const fromService = await service?.getDocumentByPath(filePath);
		if (fromService) return fromService;

		// Fallback: a markdown file outside any collection — parse standalone.
		const extracted = extractFrontmatter(code);
		const meta = validateFrontmatter(
			extracted.data,
			filePath,
			config.frontmatter as never,
		);
		const { ast } = await parseMarkdown(extracted.content, {
			remarkPlugins: config.markdown.remarkPlugins,
		});
		return transformToIR(ast, meta, filePath);
	}

	return {
		name: "docvia",

		configResolved(resolved) {
			root = resolved.root;
			isDev = resolved.command === "serve";
		},

		async buildStart() {
			ready = initialCompile();
			await ready;
		},

		resolveId(id) {
			if (BROWSER_SOURCE_IDS.has(id)) {
				return isDev
					? VIRTUAL_BROWSER_ID
					: resolve(root, config.outDir, "browser.ts");
			}
			if (!SOURCE_IDS.has(id)) return null;
			return isDev
				? VIRTUAL_SOURCE_ID
				: resolve(root, config.outDir, "source.ts");
		},

		load(id) {
			if (id === VIRTUAL_BROWSER_ID) {
				return service ? service.getVirtualBrowserModule() : null;
			}
			if (id !== VIRTUAL_SOURCE_ID) return null;
			return service ? service.getVirtualSourceModule() : null;
		},

		async transform(code, id) {
			if (!id.endsWith(".md?docvia")) return null;
			const filePath = id.slice(0, -"?docvia".length);
			if (ready) await ready;
			const ir = await toIR(code, filePath);
			const rendered = await renderer.renderPage(ir);
			return { code: rendered.code, map: (rendered.map as any) ?? null };
		},

		/**
		 * Markdown content change. Recompile the one file; a route-map change
		 * (new/renamed/removed slug) needs a full reload, otherwise let Vite
		 * hot-swap the `.md?docvia` module — the re-transform reads fresh IR.
		 */
		async handleHotUpdate(ctx: HmrContext) {
			if (!service || !ctx.file.endsWith(".md")) return;
			const sourceDirAbs = resolve(root, config.sourceDir);
			if (!resolve(ctx.file).startsWith(sourceDirAbs)) return;

			try {
				const result = await service.invalidate([ctx.file]);
				await service.emitTypeDeclarations();

				if (result.routeMapChanged) {
					const vmod = ctx.server.moduleGraph.getModuleById(VIRTUAL_SOURCE_ID);
					if (vmod) ctx.server.moduleGraph.invalidateModule(vmod);
					ctx.server.ws.send({ type: "full-reload" });
					return [];
				}
				return ctx.modules;
			} catch (err) {
				ctx.server.ws.send({ type: "error", err: toErrorPayload(err) });
				return [];
			}
		},

		configureServer(server: ViteDevServer) {
			const sourceDirAbs = resolve(root, config.sourceDir);
			server.watcher.add(sourceDirAbs);

			// Added/removed markdown files always change the route map, so the
			// virtual source module is regenerated and the page is reloaded.
			// Plain content edits are handled by `handleHotUpdate` instead.
			let timer: ReturnType<typeof setTimeout> | null = null;
			const pending = new Set<string>();

			async function flush(): Promise<void> {
				if (!service || pending.size === 0) return;
				const files = [...pending];
				pending.clear();
				try {
					await service.invalidate(files);
					await service.emitTypeDeclarations();
					const mod = server.moduleGraph.getModuleById(VIRTUAL_SOURCE_ID);
					if (mod) server.moduleGraph.invalidateModule(mod);
					server.ws.send({ type: "full-reload" });
				} catch (err) {
					server.ws.send({ type: "error", err: toErrorPayload(err) });
				}
			}

			function schedule(file: string): void {
				if (!file.endsWith(".md")) return;
				if (!resolve(file).startsWith(sourceDirAbs)) return;
				pending.add(file);
				if (timer) clearTimeout(timer);
				timer = setTimeout(() => {
					void flush();
				}, 30);
			}

			server.watcher.on("add", schedule);
			server.watcher.on("unlink", schedule);
		},
	};
}
