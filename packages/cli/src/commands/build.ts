import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { docviaError } from "@docvia/ir";
import { resolveProject } from "@docvia/plugins";
import { CompileService } from "@docvia/runtime";
import { c, fmtMs, formatError, header, log, step, symbols } from "../logger";

export interface BuildOptions {
	docs?: string;
	out?: string;
	config?: string;
	noCache?: boolean;
	verbose?: boolean;
}

/** Path relative to the cwd — friendlier than an absolute path. */
function rel(p: string): string {
	const r = relative(process.cwd(), p);
	return r === "" ? "." : r;
}

export async function runBuild(opts: BuildOptions): Promise<void> {
	const verbose = opts.verbose === true;
	header("build");
	const t0 = performance.now();

	try {
		// 1 — config
		const tConfig = performance.now();
		const { config, configPath, projectRoot } = await resolveProject({
			configPath: opts.config,
		});
		if (!configPath) {
			log.warn(
				`No ${c.cyan("docvia.config.ts")} found; using defaults (no renderer).`,
			);
		} else if (verbose) {
			step("config", rel(configPath), performance.now() - tConfig);
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

		const service = new CompileService({
			sourceDir: dir,
			outDir,
			renderer,
			plugins: [...config.plugins],
			config,
			projectRoot,
			configPath,
			incremental: !opts.noCache,
		});

		// 2 — compile
		const tCompile = performance.now();
		const result = await service.compileAll();
		const { total, compiled, cached } = result.stats;
		step(
			"compile",
			`${rel(dir)} ${symbols.dot} ${total} file${total === 1 ? "" : "s"}`,
			performance.now() - tCompile,
		);
		if (verbose) {
			const cacheNote = cached > 0 ? `, ${cached} cached` : "";
			log.plain(
				c.gray(
					`      ${compiled} compiled${cacheNote} · plugins: ${
						config.plugins.length
					} · renderer: ${renderer.name}`,
				),
			);
		}

		// 3 — emit
		const tEmit = performance.now();
		await service.emitDiskModuleGraph();
		step(
			"emit",
			`${rel(outDir)} ${symbols.dot} ${result.pages.length} page${
				result.pages.length === 1 ? "" : "s"
			}`,
			performance.now() - tEmit,
		);

		console.log("");
		console.log(
			`  ${c.green(symbols.tick)} ${c.bold(
				`Built ${result.pages.length} page${
					result.pages.length === 1 ? "" : "s"
				}`,
			)} ${c.gray(`in ${fmtMs(performance.now() - t0)}`)}`,
		);
		console.log("");
	} catch (err) {
		console.log("");
		log.error(`  ${formatError(err)}`);
		if (err instanceof docviaError && err.cause) {
			log.error(c.gray(String(err.cause.stack ?? err.cause.message)));
		} else if (!(err instanceof docviaError)) {
			log.error(c.gray(String((err as Error).stack ?? "")));
		}
		process.exit(1);
	}
}
