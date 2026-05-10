import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { compile } from "@docvia/compiler";
import type { docviaConfig } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { defineConfig, loadConfig } from "@docvia/plugins";
import { c, formatError, log, symbols } from "../logger";

export interface BuildOptions {
	docs?: string;
	out?: string;
	config?: string;
	noCache?: boolean;
}

function fmtMs(ms: number): string {
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

export async function runBuild(opts: BuildOptions): Promise<void> {
	try {
		const configPath = resolve(opts.config ?? "docvia.config.ts");
		const projectRoot = existsSync(configPath)
			? dirname(configPath)
			: process.cwd();

		let config: docviaConfig;
		if (existsSync(configPath)) {
			config = await loadConfig(configPath);
		} else {
			log.warn(
				`No ${c.cyan("docvia.config.ts")} found at ${configPath}; using defaults (no renderer).`,
			);
			config = defineConfig({});
		}

		const dir = resolve(projectRoot, opts.docs ?? config.sourceDir);
		const outDir = resolve(projectRoot, opts.out ?? config.outDir);

		if (!existsSync(dir)) {
			throw new docviaError(
				"CONFIG_ERROR",
				`Docs directory not found: ${dir}\n  Run \`docvia init\` first.`,
				dir,
			);
		}

		const renderer = config.renderer;
		if (!renderer) {
			throw new docviaError(
				"CONFIG_ERROR",
				"No renderer configured. Set `renderer` in docvia.config.ts (e.g. createReactRenderer(...) or createSvelteRenderer(...)).",
				configPath,
			);
		}

		log.info("Building documentation...");
		const result = await compile({
			sourceDir: dir,
			outDir,
			renderer,
			plugins: [...config.plugins],
			config,
			projectRoot,
			incremental: !opts.noCache,
		});

		const cached = result.stats.cached;
		const compiled = result.stats.compiled;
		const cachedNote = cached > 0 ? ` ${c.gray(`(${cached} cached)`)}` : "";

		console.log("");
		log.success(`Build complete in ${fmtMs(result.duration)}`);
		log.plain(
			`  ${result.stats.total} files ${symbols.arrow} ${compiled} compiled${cachedNote}`,
		);
		log.plain(`  ${result.pages.length} pages generated`);
		log.plain(`  Output: ${c.cyan(outDir)}`);
	} catch (err) {
		log.error(formatError(err));
		if (err instanceof docviaError && err.cause) {
			log.error(c.gray(String(err.cause.stack ?? err.cause.message)));
		} else if (!(err instanceof docviaError)) {
			log.error(c.gray(String((err as Error).stack ?? "")));
		}
		process.exit(1);
	}
}
