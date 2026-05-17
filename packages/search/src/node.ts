import type { IRDocument } from "@docvia/ir";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createSearchIndexer } from "./index";

// Node-only entry point: reading the docvia build output touches the
// filesystem, so it must stay out of the browser bundle that `createSearch`
// ships in. Import these from `@docvia/search/node`.

export interface SearchSourceOptions {
	/**
	 * The docvia build output directory — the `outDir` from `docvia.config.ts`.
	 * Resolved relative to the current working directory. Defaults to `.docvia`.
	 */
	outDir?: string;
	/**
	 * Restrict indexing to a single collection (by its `name` in the docvia
	 * config). Omit to index every collection found in the build output.
	 */
	collection?: string;
}

/** Recursively gather IR chunk files, skipping the build manifest. */
async function collectChunks(dir: string): Promise<IRDocument[]> {
	// A missing directory (e.g. an unknown collection name) yields no
	// documents rather than throwing — callers get an empty index.
	const entries = await readdir(dir, { withFileTypes: true }).catch(() => null);
	if (!entries) return [];

	const docs: IRDocument[] = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			docs.push(...(await collectChunks(full)));
		} else if (entry.name.endsWith(".json") && entry.name !== "manifest.json") {
			docs.push(JSON.parse(await readFile(full, "utf-8")) as IRDocument);
		}
	}
	return docs;
}

/**
 * Load the per-route IR chunks that `docvia build` emits to `<outDir>/ir/`.
 * This is the documents side of the search pipeline — feed the result to
 * {@link createSearchIndexer}, or use {@link buildSearchIndex} to do both.
 */
export async function loadIRDocuments(
	options: SearchSourceOptions = {},
): Promise<IRDocument[]> {
	const irRoot = resolve(options.outDir ?? ".docvia", "ir");
	const target = options.collection ? join(irRoot, options.collection) : irRoot;
	return collectChunks(target);
}

/**
 * Build a search index straight from a docvia build output directory and
 * return the exported index JSON — the whole indexing pipeline in one call.
 * Serve the result as a static asset and rehydrate it with `createSearch()`.
 */
export async function buildSearchIndex(
	options: SearchSourceOptions = {},
): Promise<string> {
	const indexer = await createSearchIndexer();
	await indexer.buildIndex(await loadIRDocuments(options));
	return indexer.exportIndex();
}
