import { compile } from "@docvia/compiler";
import type { docviaConfig } from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { defineConfig, loadConfig } from "@docvia/plugins";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { c, formatError, log, symbols } from "../logger";

export interface DevOptions {
	docs?: string;
	out?: string;
	config?: string;
}

function fmtMs(ms: number): string {
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

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

	const sourceDir = resolve(projectRoot, opts.docs ?? config.sourceDir ?? "docs");
	const outDir = resolve(projectRoot, opts.out ?? config.outDir ?? ".docvia");

	if (!existsSync(sourceDir)) {
		log.error(`${c.red("[ERROR]")} Source directory not found: ${sourceDir}`);
		process.exit(1);
	}
	if (!config.renderer) {
		log.error(formatError(new docviaError("CONFIG_ERROR", "No renderer configured")));
		process.exit(1);
	}

	log.info("Starting dev mode...");

	// Initial build
	try {
		const result = await compile({
			sourceDir,
			outDir,
			renderer: config.renderer,
			plugins: [...config.plugins],
			config,
			projectRoot,
			incremental: true,
		});
		log.success(
			`Initial build: ${fmtMs(result.duration)} ${c.gray(`(${result.stats.total} files, ${result.stats.compiled} compiled, ${result.stats.cached} cached)`)}`,
		);
	} catch (err) {
		log.error(formatError(err));
		// Don't exit on initial build failure — keep watching so the user can fix it
	}

	const { watch } = await import("chokidar");

	const watchTargets = [sourceDir];
	if (existsSync(configPath)) watchTargets.push(configPath);

	const watcher = watch(watchTargets, {
		ignoreInitial: true,
		awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
	});

	let pending = new Set<string>();
	let timer: ReturnType<typeof setTimeout> | null = null;
	let building: Promise<unknown> | null = null;
	let queued = false;

	async function rebuild(reason: string): Promise<void> {
		// Reload config if it changed
		if (reason === "config") {
			try {
				config = await loadConfig(configPath);
				log.info(`Config reloaded ${c.gray(`(${configPath})`)}`);
			} catch (err) {
				log.error(formatError(err));
				return;
			}
			if (!config.renderer) {
				log.error("Config reloaded but no renderer configured.");
				return;
			}
		}

		const start = performance.now();
		try {
			const result = await compile({
				sourceDir,
				outDir,
				renderer: config.renderer!,
				plugins: [...config.plugins],
				config,
				projectRoot,
				incremental: true,
			});
			const ms = fmtMs(performance.now() - start);
			log.success(
				`Rebuild: ${ms} ${c.gray(`(${result.stats.compiled} compiled, ${result.stats.cached} cached)`)}`,
			);
		} catch (err) {
			log.error(formatError(err));
		}
	}

	function flush(): void {
		if (pending.size === 0 && !queued) return;
		const files = [...pending];
		pending = new Set();
		timer = null;

		const reason = files.includes(configPath) ? "config" : "files";
		const label =
			reason === "config"
				? "config change"
				: `${files.length} file${files.length === 1 ? "" : "s"}`;

		log.info(`Rebuilding ${c.gray(`(${label})`)}...`);

		// Build lock: serialize concurrent rebuilds
		if (building) {
			queued = true;
			building.finally(() => {
				queued = false;
				flush();
			});
			return;
		}

		building = rebuild(reason).finally(() => {
			building = null;
			if (queued) {
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
