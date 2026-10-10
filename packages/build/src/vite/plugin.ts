import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import type { docviaConfig, RendererAdapter } from "@docvia/core";
import { docviaError } from "@docvia/core";
import { resolveConfigPath, resolveProject } from "../config";
import {
	assertCollectionDirs,
	assertComponentsExist,
	collectionTypeData,
	emitTypeDeclarations,
	generateVirtualRegistry,
	generateVirtualSource,
	type IndexedPage,
	locate,
	MACRO_SOURCE,
	type MacroCollection,
	PagePipeline,
	type ResolvedCollection,
	relativeInside,
	resolveComponents,
	samePath,
	scanCollection,
	transformMacroModule,
} from "../index";
import type {
	AliasOptions,
	EnvironmentModuleGraph,
	Plugin,
	ViteDevServer,
} from "vite";
import {
	bodiesCollection,
	bodiesModuleId,
	evaluateWithVite,
	generateBodiesModule,
} from "./macro";

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
const MARKDOWN = /\.md\?docvia(?:[&=].*)?$/;

export interface DocviaVitePluginOptions {
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

/** Generated modules import `@docvia/core/source`; fail at startup rather than at first request. */
function assertSourceInstalled(root: string): void {
	try {
		createRequire(join(root, "package.json")).resolve(
			"@docvia/core/source/internal",
		);
	} catch {
		throw new docviaError(
			"CONFIG_ERROR",
			`@docvia/core is not resolvable from ${root}. docvia's generated modules import it: add it to your dependencies.`,
		);
	}
}

/**
 * Serves `virtual:docvia/{source,source/browser,registry}` and compiles pages on demand: the
 * index reads frontmatter only, bodies compile when first imported. Nothing is written in
 * build; dev writes `.docvia/*.d.ts` in the background. Without a config argument it loads
 * `docvia.config.*` from the Vite root.
 */
export function docvia(
	inlineConfig?: docviaConfig,
	options: DocviaVitePluginOptions = {},
): Plugin {
	let config: docviaConfig | undefined = inlineConfig;
	let configPath: string | undefined;
	let root = process.cwd();
	let isDev = false;
	let pipeline: PagePipeline | undefined;
	let alias: AliasOptions | undefined;

	function requireConfig(): docviaConfig & { renderer: RendererAdapter } {
		if (!config?.renderer) {
			throw new docviaError(
				"CONFIG_ERROR",
				"No renderer found: install @docvia/renderer-react or @docvia/renderer-svelte, or set `renderer` in docvia.config.ts",
				configPath,
			);
		}
		return config as docviaConfig & { renderer: RendererAdapter };
	}

	function getPipeline(): PagePipeline {
		pipeline ??= new PagePipeline(requireConfig(), root);
		return pipeline;
	}

	// Frontmatter of every page, scanned once and kept current per file event. It feeds the
	// source module (instead of one module per page) and `.docvia/*.d.ts`.
	const pagesByPath = new Map<string, IndexedPage>();
	const scanned = new Map<string, Promise<void>>();
	const indexUpdates = new Map<string, Promise<boolean>>();
	// Modules that inlined a collection's index through `defineDocs()`, for HMR.
	const macroModules = new Map<string, Set<string>>();
	let devServer: ViteDevServer | undefined;
	let typesTimer: ReturnType<typeof setTimeout> | undefined;

	function indexCollection(collection: ResolvedCollection): Promise<void> {
		let pending = scanned.get(collection.name);
		if (!pending) {
			pending = scanCollection(getPipeline(), collection).then((pages) => {
				for (const p of pages) {
					pagesByPath.set(resolve(p.absPath), {
						collection: p.collection.name,
						absPath: p.absPath,
						meta: p.meta,
					});
				}
			});
			pending.catch(() => scanned.delete(collection.name));
			scanned.set(collection.name, pending);
		}
		return pending;
	}

	async function getIndex(): Promise<Map<string, IndexedPage>> {
		await Promise.all(getPipeline().collections.map(indexCollection));
		return pagesByPath;
	}

	/** Register a `defineDocs()` collection and return its frontmatter keyed by relative path. */
	async function macroIndex(
		def: MacroCollection,
	): Promise<Record<string, unknown>> {
		const pipelineNow = getPipeline();
		const previous = pipelineNow.collections.find((c) => c.name === def.name);
		const collection = pipelineNow.registerCollection(def);
		if (!previous) devServer?.watcher.add(def.dir);
		// A new schema re-validates every page of the collection.
		if (previous && previous.frontmatter !== collection.frontmatter) {
			scanned.delete(def.name);
		}
		await indexCollection(collection);
		const out: Record<string, unknown> = {};
		for (const page of pagesByPath.values()) {
			if (page.collection !== def.name) continue;
			const rel = relativeInside(def.dir, page.absPath);
			if (rel) out[rel] = page.meta;
		}
		return out;
	}

	function writeTypes(server: ViteDevServer): void {
		// `defineDocs()` apps get their types from their own file: write nothing for them.
		const typed = getPipeline().collections.filter(
			(c) => !c.macro && existsSync(c.dir),
		);
		if (typed.length === 0) return;
		clearTimeout(typesTimer);
		typesTimer = setTimeout(() => {
			const p = getPipeline();
			const outDir = resolve(root, p.config.outDir);
			getIndex()
				.then((pages) =>
					emitTypeDeclarations({
						outDir,
						projectRoot: root,
						config: p.config,
						collections: collectionTypeData(
							p.collections,
							[...pages.values()],
							outDir,
							configPath,
						),
					}),
				)
				.catch((err) => server.config.logger.warn(toErrorPayload(err).message));
		}, 100);
		typesTimer.unref?.();
	}

	/** Apply one file event to the index; true when the route index must be regenerated. */
	function updateIndex(
		file: string,
		collection: string,
		read: () => string | Promise<string>,
		deleted: boolean,
		timestamp: number,
	): Promise<boolean> {
		const key = `${file}|${timestamp}`;
		let pending = indexUpdates.get(key);
		if (!pending) {
			pending = (async () => {
				const pages = await getIndex();
				const abs = resolve(file);
				const before = pages.get(abs);
				if (deleted) return pages.delete(abs);
				const meta = await getPipeline().meta(abs, await read(), collection);
				pages.set(abs, { collection, absPath: before?.absPath ?? abs, meta });
				return JSON.stringify(before?.meta) !== JSON.stringify(meta);
			})();
			indexUpdates.set(key, pending);
			setTimeout(() => indexUpdates.delete(key), 5000).unref?.();
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
					include: ["@docvia/core/source/internal", ...runtimePackages],
				},
				ssr: { noExternal: runtimePackages },
			};
		},

		configResolved(resolved) {
			root = resolved.root;
			alias = resolved.resolve?.alias;
			isDev = resolved.command === "serve";
			pipeline = undefined;
			assertSourceInstalled(root);
		},

		buildStart() {
			// Cheap checks only: no content is read here.
			assertComponentsExist(requireConfig(), root);
			assertCollectionDirs(getPipeline().collections);
		},

		resolveId(id) {
			if (bodiesCollection(id) !== undefined) return `\0${id}`;
			return RESOLVED.get(id) ?? null;
		},

		async load(id) {
			const bodiesOf = bodiesCollection(id);
			if (bodiesOf !== undefined) {
				const collection = getPipeline().collections.find(
					(c) => c.name === bodiesOf,
				);
				return collection ? generateBodiesModule(root, collection) : null;
			}
			if (!RESOLVED_IDS.includes(id)) return null;
			if (id === `\0${IDS.registry}`) {
				if (isDev && resolveComponents(requireConfig(), root).length === 0) {
					this.warn(
						"virtual:docvia/registry is empty: no `components` are configured.",
					);
				}
				return generateVirtualRegistry(requireConfig(), root);
			}
			// Bodies are lazy, so one module serves server and browser alike.
			const configCollections = getPipeline().collections.filter(
				(c) => !c.macro,
			);
			return getIndex().then((pages) =>
				generateVirtualSource(configCollections, root, pages),
			);
		},

		async transform(code, id) {
			if (!MARKDOWN.test(id)) {
				if (id.includes("/node_modules/") || !code.includes(MACRO_SOURCE)) {
					return null;
				}
				const file = id.split("?")[0] ?? id;
				const result = await transformMacroModule(code, id, {
					root,
					config: requireConfig(),
					index: macroIndex,
					evaluate: () => evaluateWithVite(file, root, alias),
					emit: { kind: "glob", bodiesModule: bodiesModuleId },
				});
				if (!result) return null;
				for (const { name } of result.collections) {
					const ids = macroModules.get(name) ?? new Set();
					ids.add(id);
					macroModules.set(name, ids);
				}
				return { code: result.code, map: result.map };
			}
			const [filePath = "", query = ""] = id.split("?");
			const params = new URLSearchParams(query);
			const collection = params.get("collection") ?? undefined;
			const p = getPipeline();
			if (params.get("only") === "meta") {
				const meta = await p.meta(filePath, code, collection);
				return {
					code: `export const meta = ${JSON.stringify(meta)};`,
					map: null,
				};
			}
			const body = await p.module(filePath, code, collection);
			// Self-accepting in dev: a body edit swaps this module alone, with no SSR program reload.
			const hot = isDev
				? "\nif (import.meta.hot) import.meta.hot.accept();\n"
				: "";
			return { code: body + hot, map: null };
		},

		async hotUpdate({ file, type, modules, server, read, timestamp }) {
			const owner = file.endsWith(".md")
				? locate(getPipeline().collections, file)
				: undefined;
			if (!owner) return;
			let routesChanged: boolean;
			try {
				routesChanged = await updateIndex(
					file,
					owner.collection.name,
					read,
					type === "delete",
					timestamp,
				);
			} catch (err) {
				if (this.environment.name === "client") {
					this.environment.hot.send({
						type: "error",
						err: toErrorPayload(err),
					});
				}
				return [];
			}
			if (this.environment.name === "client") writeTypes(server);
			// Body-only edits swap the self-accepting page module on the server; the browser reloads
			// to fetch the re-rendered page. Frontmatter, adds and deletes rebuild the index.
			if (!routesChanged && type === "update") {
				if (this.environment.name !== "client") return modules;
				this.environment.hot.send({ type: "full-reload" });
				return [];
			}
			invalidateVirtualModules(this.environment.moduleGraph);
			const graph = this.environment.moduleGraph;
			const stale = [...(macroModules.get(owner.collection.name) ?? [])];
			// Adds and deletes change the body globs; frontmatter edits don't.
			if (type !== "update") {
				stale.push(`\0${bodiesModuleId(owner.collection.name)}`);
			}
			for (const id of stale) {
				const mod = graph.getModuleById(id);
				if (mod) graph.invalidateModule(mod);
			}
			this.environment.hot.send({ type: "full-reload" });
			return [];
		},

		configureServer(server) {
			devServer = server;
			// Collections may live outside the Vite root (e.g. a submodule); watch them all.
			server.watcher.add(getPipeline().collections.map((c) => c.dir));
			writeTypes(server);
			const watched = inlineConfig ? undefined : configPath;
			if (watched) {
				server.watcher.add(watched);
				server.watcher.on("change", (file) => {
					if (samePath(file, watched)) void server.restart();
				});
			}
		},
	};
}
