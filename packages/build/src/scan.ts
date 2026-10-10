import { existsSync } from "node:fs";
import type { ResolvedCollection } from "./collections";
import { compileParallel, readFileTree } from "./fs";
import type { PageMetaRecord, PagePipeline } from "./pages";

export interface ScannedPage {
	readonly collection: ResolvedCollection;
	readonly absPath: string;
	readonly relativePath: string;
	readonly meta: PageMetaRecord;
}

/** One collection's pages: frontmatter and slug, without parsing any markdown body. */
export async function scanCollection(
	pipeline: PagePipeline,
	collection: ResolvedCollection,
): Promise<ScannedPage[]> {
	if (!existsSync(collection.dir)) return [];
	const files = await readFileTree(collection.dir);
	const pages: ScannedPage[] = [];
	await compileParallel(files, async (file) => {
		pages.push({
			collection,
			absPath: file.path,
			relativePath: file.relativePath,
			meta: await pipeline.meta(file.path, file.content, collection.name),
		});
	});
	return pages.sort((a, b) => a.absPath.localeCompare(b.absPath));
}

/** Every page of every collection. */
export async function scanPages(
	pipeline: PagePipeline,
): Promise<ScannedPage[]> {
	const pages: ScannedPage[] = [];
	for (const collection of pipeline.collections) {
		pages.push(...(await scanCollection(pipeline, collection)));
	}
	return pages;
}
