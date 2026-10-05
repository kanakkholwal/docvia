import { resolveProject } from "@docvia/plugins";
import { CompileService } from "./service";

export interface SyncOptions {
	/** Directory to search for `docvia.config.*`. Default: `process.cwd()`. */
	readonly cwd?: string;
	/** Explicit config path, relative to `cwd`. */
	readonly configPath?: string;
}

/**
 * Compile the content and write `.docvia/types.d.ts` + `.docvia/env.d.ts` without a
 * bundler. Run it before `tsc` / `svelte-check` in CI, like `svelte-kit sync`.
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
	if (!config.renderer) {
		throw new Error("[docvia] No renderer configured in docvia config");
	}
	const service = new CompileService({
		sourceDir: config.sourceDir,
		outDir: config.outDir,
		renderer: config.renderer,
		plugins: [...config.plugins],
		config,
		projectRoot,
		configPath,
	});
	const result = await service.compileAll();
	await service.emitTypeDeclarations();
	return { outDir: service.outDir, pages: result.stats.total };
}
