import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { IRDocument, RendererAdapter } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { loadConfig } from "@docvia/plugins";
import { CompileService } from "@docvia/runtime";
import { createSearchIndexer } from "./index";

// Node-only entry point: building the index compiles the docs in-process, which
// touches the filesystem and pulls in the compiler — so it must stay out of the
// browser bundle that `createSearch` ships in. Import these from
// `@docvia/search/node`.

export interface SearchSourceOptions {
	/**
	 * Path to the project's `docvia.config.ts`. Resolved relative to the current
	 * working directory. Defaults to `docvia.config.ts`.
	 */
	configPath?: string;
	/**
	 * Restrict indexing to a single collection (by its `name` in the docvia
	 * config). Omit to index every collection.
	 */
	collection?: string;
}

// Compiling to IR never invokes the renderer (the pipeline stops at
// `beforeRender`), but `CompileService` requires one structurally. If the config
// somehow omits a renderer, fall back to this no-op so indexing still works.
const NOOP_RENDERER: RendererAdapter = {
	name: "noop",
	renderPage: async () => ({ code: "", map: undefined }) as never,
	renderManifest: async () => "",
};

/**
 * Compile the project's docs in-process and return the IR for every page —
 * the documents side of the search pipeline. Under the in-place architecture
 * nothing is emitted to disk to read back, so we drive a {@link CompileService}
 * directly (the same pipeline the build uses) and collect its IR. Feed the
 * result to {@link createSearchIndexer}, or use {@link buildSearchIndex} to do
 * both.
 */
export async function loadIRDocuments(
	options: SearchSourceOptions = {},
): Promise<IRDocument[]> {
	const configPath = resolve(options.configPath ?? "docvia.config.ts");
	if (!existsSync(configPath)) {
		throw new docviaError(
			"CONFIG_ERROR",
			`docvia config not found: ${configPath}\n  Pass \`configPath\` to buildSearchIndex / loadIRDocuments.`,
			configPath,
		);
	}

	const config = await loadConfig(configPath);
	const projectRoot = dirname(configPath);

	const service = new CompileService({
		sourceDir: resolve(projectRoot, config.sourceDir),
		outDir: resolve(projectRoot, config.outDir),
		renderer: config.renderer ?? NOOP_RENDERER,
		plugins: [...config.plugins],
		config,
		projectRoot,
		// A one-shot index build — no cache to consult or write.
		incremental: false,
	});

	await service.compileAll();
	const docs = await service.getDocuments(options.collection);
	return docs.map((d) => d.document);
}

/**
 * Compile the project's docs and build a search index in one call, returning
 * the exported index JSON. Serve the result as a static asset and rehydrate it
 * with `createSearch()`.
 */
export async function buildSearchIndex(
	options: SearchSourceOptions = {},
): Promise<string> {
	const indexer = await createSearchIndexer();
	await indexer.buildIndex(await loadIRDocuments(options));
	return indexer.exportIndex();
}
