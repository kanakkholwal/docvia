import { resolve } from "node:path";
import { resolveProject } from "@docvia/plugins";
import { emitTypeDeclarations } from "./emit";
import { PagePipeline } from "./pages";
import { scanPages } from "./scan";
import { collectionTypeData } from "./type-data";

export interface SyncOptions {
	/** Directory to search for `docvia.config.*`. Default: `process.cwd()`. */
	readonly cwd?: string;
	/** Explicit config path, relative to `cwd`. */
	readonly configPath?: string;
}

/**
 * Write `.docvia/types.d.ts` + `.docvia/env.d.ts` from frontmatter alone, without a bundler or a
 * full compile. Run it before `tsc` / `svelte-check` in CI, like `svelte-kit sync`.
 */
export async function syncTypes(options: SyncOptions = {}): Promise<{
	readonly outDir: string;
	readonly pages: number;
}> {
	const { config, configPath, projectRoot } = await resolveProject({
		cwd: options.cwd,
		configPath: options.configPath,
		required: true,
	});
	const pipeline = new PagePipeline(config, projectRoot);
	const pages = await scanPages(pipeline);
	const outDir = resolve(projectRoot, config.outDir);
	await emitTypeDeclarations({
		outDir,
		projectRoot,
		config,
		collections: collectionTypeData(
			pipeline.collections,
			pages.map((p) => ({ collection: p.collection.name, meta: p.meta })),
			outDir,
			configPath,
		),
	});
	return { outDir, pages: pages.length };
}
