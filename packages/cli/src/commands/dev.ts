import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import type { docviaConfig } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { defineConfig, loadConfig } from "@docvia/plugins";
import { CompileService } from "@docvia/runtime";
import { c, formatError, log, symbols } from "../logger";

export interface DevOptions {
	docs?: string;
	out?: string;
	config?: string;
}

function fmtMs(ms: number): string {
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

/**
 * `docvia dev` — the generic, framework-agnostic watch loop. Frameworks with a
 * dedicated integration (Vite via `@docvia/plugin-vite`, Next via
 * `@docvia/plugin-next`) compile in-process; this command is the fallback for
 * everything else. It drives the same `CompileService` so output is identical,
 * and recompiles incrementally via `service.invalidate()`.
 */
export async function runDev(opts: DevOptions): Promise<void> {
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

	log.info("Starting dev mode...");

	// Initial build
	try {
		const start = performance.now();
		const result = await service.compileAll();
		await service.emitDiskModuleGraph();
		log.success(
			`Initial build: ${fmtMs(performance.now() - start)} ${c.gray(`(${result.stats.total} files, ${result.stats.compiled} compiled, ${result.stats.cached} cached)`)}`,
		);
	} catch (err) {
		log.error(formatError(err));
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
				log.info(`Config reloaded ${c.gray(`(${configPath})`)}`);
				service = createService(config);
				const result = await service.compileAll();
				await service.emitDiskModuleGraph();
				log.success(
					`Rebuild: ${fmtMs(performance.now() - start)} ${c.gray(`(${result.stats.compiled} compiled, ${result.stats.cached} cached)`)}`,
				);
			} else {
				const result = await service.invalidate(files);
				await service.emitDiskModuleGraph();
				log.success(
					`Rebuild: ${fmtMs(performance.now() - start)} ${c.gray(`(${result.changed.length} recompiled)`)}`,
				);
			}
		} catch (err) {
			log.error(formatError(err));
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
		const label =
			reason === "config"
				? "config change"
				: `${files.length} file${files.length === 1 ? "" : "s"}`;
		log.info(`Rebuilding ${c.gray(`(${label})`)}...`);

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

	log.info(`Watching ${c.cyan(sourceDir)} for changes...`);
	if (existsSync(configPath)) {
		log.plain(`  ${symbols.arrow} also watching ${c.cyan(configPath)}`);
	}
	log.plain("  Press Ctrl+C to stop\n");

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
