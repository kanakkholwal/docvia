import { existsSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import type { docviaConfig } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { defineConfig, loadConfig } from "@docvia/plugins";
import { CompileService } from "@docvia/runtime";
import { c, formatError, header, log, step, symbols } from "../logger";

export interface DevOptions {
	docs?: string;
	out?: string;
	config?: string;
	verbose?: boolean;
}

/** Path relative to the cwd — friendlier than an absolute path. */
function rel(p: string): string {
	const r = relative(process.cwd(), p);
	return r === "" ? "." : r;
}

/**
 * `docvia dev` — the generic, framework-agnostic watch loop. Frameworks with a
 * dedicated integration (Vite via `@docvia/plugin-vite`, Next via
 * `@docvia/plugin-next`) compile in-process; this command is the fallback for
 * everything else. It drives the same `CompileService` so output is identical,
 * and recompiles incrementally via `service.invalidate()`.
 */
export async function runDev(opts: DevOptions): Promise<void> {
	const verbose = opts.verbose === true;
	header("dev");
	const configPath = resolve(opts.config ?? "docvia.config.ts");
	const projectRoot = existsSync(configPath)
		? dirname(configPath)
		: process.cwd();

	let config: docviaConfig;
	try {
		config = existsSync(configPath)
			? await loadConfig(configPath)
			: defineConfig({});
	} catch (err) {
		log.error(formatError(err));
		process.exit(1);
	}

	const sourceDir = resolve(
		projectRoot,
		opts.docs ?? config.sourceDir ?? "docs",
	);
	const outDir = resolve(projectRoot, opts.out ?? config.outDir ?? ".docvia");

	if (!existsSync(sourceDir)) {
		log.error(`${c.red("[ERROR]")} Source directory not found: ${sourceDir}`);
		process.exit(1);
	}
	if (!config.renderer) {
		log.error(
			formatError(new docviaError("CONFIG_ERROR", "No renderer configured")),
		);
		process.exit(1);
	}

	function createService(cfg: docviaConfig): CompileService {
		const renderer = cfg.renderer;
		if (!renderer) {
			throw new docviaError("CONFIG_ERROR", "No renderer configured");
		}
		return new CompileService({
			sourceDir,
			outDir,
			renderer,
			plugins: [...cfg.plugins],
			config: cfg,
			projectRoot,
			incremental: true,
		});
	}

	let service = createService(config);

	// Initial build
	try {
		const tCompile = performance.now();
		const result = await service.compileAll();
		const { total, compiled, cached } = result.stats;
		step(
			"compile",
			`${rel(sourceDir)} ${symbols.dot} ${total} file${total === 1 ? "" : "s"}`,
			performance.now() - tCompile,
		);
		if (verbose) {
			const cacheNote = cached > 0 ? `, ${cached} cached` : "";
			log.plain(c.gray(`      ${compiled} compiled${cacheNote}`));
		}
		const tEmit = performance.now();
		await service.emitDiskModuleGraph();
		step("emit", rel(outDir), performance.now() - tEmit);
	} catch (err) {
		console.log("");
		log.error(`  ${formatError(err)}`);
		// Don't exit — keep watching so the user can fix the error.
	}

	const { watch } = await import("chokidar");

	const watchTargets = [sourceDir];
	if (existsSync(configPath)) watchTargets.push(configPath);

	const watcher = watch(watchTargets, {
		ignoreInitial: true,
		awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
	});

	const pending = new Set<string>();
	let timer: ReturnType<typeof setTimeout> | null = null;
	let building: Promise<unknown> | null = null;
	let queued = false;

	async function rebuild(
		reason: "config" | "files",
		files: string[],
	): Promise<void> {
		const start = performance.now();
		try {
			if (reason === "config") {
				// Config change rebuilds everything — a new service is needed
				// because config (plugins, renderer, schema) is baked in at
				// construction.
				config = await loadConfig(configPath);
				service = createService(config);
				const result = await service.compileAll();
				await service.emitDiskModuleGraph();
				step(
					"reload",
					`config changed ${symbols.dot} ${result.stats.compiled} recompiled`,
					performance.now() - start,
				);
			} else {
				const result = await service.invalidate(files);
				await service.emitDiskModuleGraph();
				const n = result.changed.length;
				step(
					"rebuild",
					`${n} file${n === 1 ? "" : "s"} recompiled`,
					performance.now() - start,
				);
				if (verbose) {
					for (const f of files) {
						log.plain(c.gray(`      ${symbols.dot} ${rel(f)}`));
					}
				}
			}
		} catch (err) {
			console.log("");
			log.error(`  ${formatError(err)}`);
		}
	}

	function flush(): void {
		if (pending.size === 0) return;
		// Serialize: if a rebuild is in flight, leave changes in `pending` and
		// re-flush when it settles.
		if (building) {
			queued = true;
			return;
		}

		const files = [...pending];
		pending.clear();
		timer = null;

		const reason = files.includes(configPath) ? "config" : "files";
		if (verbose && reason === "files") {
			const names = files.map((f) => basename(f)).join(", ");
			log.plain(c.gray(`  ${symbols.arrow} changed: ${names}`));
		}

		building = rebuild(reason, files).finally(() => {
			building = null;
			if (queued || pending.size > 0) {
				queued = false;
				flush();
			}
		});
	}

	function schedule(filePath: string): void {
		pending.add(filePath);
		if (timer) clearTimeout(timer);
		timer = setTimeout(flush, 20);
	}

	watcher.on("change", schedule);
	watcher.on("add", schedule);
	watcher.on("unlink", schedule);

	const watching = existsSync(configPath)
		? `${c.cyan(rel(sourceDir))} ${c.gray(symbols.dot)} ${c.cyan(rel(configPath))}`
		: c.cyan(rel(sourceDir));
	console.log("");
	console.log(`  ${c.gray("watching")} ${watching}`);
	console.log(`  ${c.gray("press Ctrl+C to stop")}`);
	console.log("");

	// Graceful shutdown
	const shutdown = async (signal: string) => {
		log.plain("");
		log.info(`Received ${signal}, shutting down...`);
		try {
			await watcher.close();
		} catch {
			// ignore
		}
		process.exit(0);
	};
	process.once("SIGINT", () => void shutdown("SIGINT"));
	process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
