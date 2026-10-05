import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";
import type { docviaConfig, RendererAdapter } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { resolveConfigPath, resolveProject } from "@docvia/plugins";
import {
	CompileService,
	compileMarkdownToModule,
	type InvalidationResult,
} from "@docvia/runtime";
import type { EnvironmentModuleGraph, Plugin, Rollup } from "vite";

type SourceMapInput = Rollup.SourceMapInput;

// Vite convention: public `virtual:` ids, resolved ids prefixed with `\0`.
const IDS = {
	source: "virtual:docvia/source",
	browser: "virtual:docvia/source/browser",
	registry: "virtual:docvia/registry",
} as const;
const RESOLVED = new Map<string, string>(
	Object.values(IDS).map((id) => [id, `\0${id}`]),
);
const RESOLVED_IDS = [...RESOLVED.values()];
const MARKDOWN_QUERY = /\.md\?docvia$/;

export interface DocviaVitePluginOptions {
	/** Force a full rebuild, ignoring the incremental cache. Default: false. */
	readonly noCache?: boolean;
	/**
	 * `docvia.config.*` path, relative to the Vite root. Auto-detected when omitted. It is
	 * loaded when no config object is passed, and always used for generated frontmatter types.
	 */
	readonly configPath?: string | false;
}

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

function invalidateVirtualModules(graph: EnvironmentModuleGraph): void {
	for (const id of RESOLVED_IDS) {
		const mod = graph.getModuleById(id);
		if (mod) graph.invalidateModule(mod);
	}
}

/** Generated modules import `@docvia/source`; fail at startup rather than at first request. */
function assertSourceInstalled(root: string): void {
	try {
		createRequire(join(root, "package.json")).resolve(
			"@docvia/source/internal",
		);
	} catch {
		throw new docviaError(
			"CONFIG_ERROR",
			`@docvia/source is not resolvable from ${root}. docvia's generated modules import it: add it to your dependencies.`,
		);
	}
}

/**
 * Compiles markdown in-process and serves `virtual:docvia/{source,source/browser,registry}`.
 * Without a config argument it loads `docvia.config.*` from the Vite root.
 */
export function docvia(
	inlineConfig?: docviaConfig,
	options: DocviaVitePluginOptions = {},
): Plugin {
	let config: docviaConfig | undefined = inlineConfig;
	let configPath: string | undefined;
	let root = process.cwd();
	let isDev = false;
	let ready: Promise<CompileService> | null = null;
	let queue: Promise<unknown> = Promise.resolve();
	const recompiles = new Map<string, Promise<InvalidationResult>>();
	const warned = new Set<string>();

	function warnOnce(key: string, message: string): void {
		if (warned.has(key)) return;
		warned.add(key);
		console.warn(`[docvia] ${message}`);
	}

	function requireConfig(): docviaConfig & { renderer: RendererAdapter } {
		if (!config?.renderer) {
			throw new docviaError(
				"CONFIG_ERROR",
				"No renderer configured in docvia config",
				configPath,
			);
		}
		return config as docviaConfig & { renderer: RendererAdapter };
	}

	async function initialCompile(): Promise<CompileService> {
		const cfg = requireConfig();
		const service = new CompileService({
			sourceDir: cfg.sourceDir,
			outDir: cfg.outDir,
			renderer: cfg.renderer,
			plugins: [...cfg.plugins],
			config: cfg,
			projectRoot: root,
			configPath,
			incremental: !options.noCache,
		});
		await service.compileAll();
		if (isDev) {
			await service.emitTypeDeclarations();
		} else {
			await service.emitDiskModuleGraph();
		}
		return service;
	}

	function getService(): Promise<CompileService> {
		ready ??= initialCompile();
		return ready;
	}

	/** One recompile per file event, shared by every environment's `hotUpdate`. */
	function recompile(
		file: string,
		timestamp: number,
	): Promise<InvalidationResult> {
		const key = `${file}\0${timestamp}`;
		let pending = recompiles.get(key);
		if (!pending) {
			pending = getService().then((service) => {
				const run = queue.then(async () => {
					const result = await service.invalidate([file]);
					await service.emitTypeDeclarations();
					return result;
				});
				queue = run.catch(() => {});
				return run;
			});
			recompiles.set(key, pending);
			// Every environment runs `hotUpdate` within one HMR pass; drop the entry after it.
			setTimeout(() => recompiles.delete(key), 5000).unref?.();
		}
		return pending;
	}

	return {
		name: "docvia",

		async config(userConfig) {
			const viteRoot = resolve(userConfig.root ?? process.cwd());
			if (!config) {
				const project = await resolveProject({
					cwd: viteRoot,
					configPath:
						options.configPath === false ? undefined : options.configPath,
					required: true,
				});
				config = project.config;
				configPath = project.configPath;
			} else {
				configPath = resolveConfigPath(viteRoot, options.configPath);
			}
			const runtimePackages = [
				...(requireConfig().renderer.runtimePackages ?? []),
			];
			return {
				optimizeDeps: {
					include: ["@docvia/source/internal", ...runtimePackages],
				},
				ssr: { noExternal: runtimePackages },
			};
		},

		configResolved(resolved) {
			root = resolved.root;
			isDev = resolved.command === "serve";
			assertSourceInstalled(root);
		},

		async buildStart() {
			await getService();
		},

		resolveId(id) {
			return RESOLVED.get(id) ?? null;
		},

		async load(id) {
			if (!RESOLVED_IDS.includes(id)) return null;
			const service = await getService();
			if (id === `\0${IDS.registry}`) {
				if (service.componentCount() === 0) {
					warnOnce(
						"empty-registry",
						"virtual:docvia/registry is empty: no `components` are configured.",
					);
				}
				return service.getVirtualRegistryModule();
			}
			if (id === `\0${IDS.browser}`) return service.getVirtualBrowserModule();
			if (this.environment?.config.consumer === "client") {
				warnOnce(
					"client-source",
					"virtual:docvia/source was imported by client code, which bundles every page. Import `virtual:docvia/source/browser` (lazy pages) or `virtual:docvia/registry` instead.",
				);
			}
			return service.getVirtualSourceModule();
		},

		transform: {
			filter: { id: MARKDOWN_QUERY },
			async handler(code, id) {
				const filePath = id.slice(0, -"?docvia".length);
				const service = await getService();
				const cfg = requireConfig();
				const ir = await service.getDocumentByPath(filePath);
				// Markdown outside every collection still runs the full plugin pipeline.
				const rendered = ir
					? await cfg.renderer.renderPage(ir)
					: await compileMarkdownToModule({
							code,
							filePath,
							relativePath: basename(filePath),
							config: cfg,
						});
				return {
					code: rendered.code,
					map: (rendered.map ?? null) as SourceMapInput | null,
				};
			},
		},

		async hotUpdate({ file, type, modules, timestamp }) {
			const service = await getService();
			if (!service.owns(file)) return;
			const env = this.environment;
			try {
				const result = await recompile(file, timestamp);
				if (type === "update" && !result.routeMapChanged) return modules;
			} catch (err) {
				if (env.name === "client") {
					env.hot.send({ type: "error", err: toErrorPayload(err) });
				}
				return [];
			}
			// A page appeared, disappeared or moved: regenerate the virtual modules everywhere.
			invalidateVirtualModules(env.moduleGraph);
			env.hot.send({ type: "full-reload" });
			return [];
		},

		configureServer(server) {
			// Collections may live outside the Vite root (e.g. a submodule); watch them all.
			getService().then(
				(service) => server.watcher.add(service.collectionDirs()),
				(err) => server.config.logger.error(toErrorPayload(err).message),
			);
		},
	};
}
