// biome-ignore-all lint/suspicious/noExplicitAny: Next.js webpack/Turbopack config and phase context shapes are intentionally untyped passthroughs.
import {
	closeSync,
	existsSync,
	openSync,
	readFileSync,
	rmSync,
	writeSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import type { docviaConfig } from "@docvia/ir";
import type { NextConfig } from "next";

export interface DocviaNextOptions {
	/** Path to docvia.config.ts relative to project root (default: './docvia.config.ts') */
	configPath?: string;
}

const logger = {
	info(msg: string) {
		console.log(`\x1b[36m[docvia]\x1b[0m ${msg}`);
	},
	success(msg: string) {
		console.log(`\x1b[32m[docvia]\x1b[0m ${msg}`);
	},
	warn(msg: string) {
		console.warn(`\x1b[33m[docvia]\x1b[0m ${msg}`);
	},
	error(msg: string, err?: unknown) {
		console.error(`\x1b[31m[docvia]\x1b[0m ${msg}`);
		if (err) console.error(err);
	},
};

let _initPromise: Promise<docviaConfig | null> | null = null;
let _watcherCleanup: (() => void) | null = null;

function _findTurbopackRoot(startDir: string): string {
	let currentDir = startDir;

	while (true) {
		if (
			existsSync(resolve(currentDir, "pnpm-lock.yaml")) ||
			existsSync(resolve(currentDir, "package-lock.json")) ||
			existsSync(resolve(currentDir, "yarn.lock")) ||
			existsSync(resolve(currentDir, "bun.lock")) ||
			existsSync(resolve(currentDir, "bun.lockb"))
		) {
			return currentDir;
		}

		const parentDir = resolve(currentDir, "..");
		if (parentDir === currentDir) {
			return startDir;
		}

		currentDir = parentDir;
	}
}

function _toTurbopackAliasPath(filePath: string, rootDir: string): string {
	const normalizedRelativePath = relative(rootDir, filePath).replace(
		/\\/g,
		"/",
	);

	if (normalizedRelativePath.startsWith(".")) {
		return normalizedRelativePath;
	}

	if (!normalizedRelativePath.startsWith("..")) {
		return `./${normalizedRelativePath}`;
	}

	return filePath.replace(/\\/g, "/");
}

// Lock files older than this are considered stale (left over from a crashed
// process). 60s is a generous upper bound for the docvia compile step on the
// largest realistic doc set; tune up if false-positive stale-detection ever
// becomes a problem.
const LOCK_MAX_AGE_MS = 60_000;

interface LockMetadata {
	readonly pid: number;
	readonly startedAt: number;
}

function readLockMetadata(lockPath: string): LockMetadata | null {
	try {
		const raw = readFileSync(lockPath, "utf-8");
		const parsed = JSON.parse(raw) as Partial<LockMetadata>;
		if (
			typeof parsed.pid !== "number" ||
			typeof parsed.startedAt !== "number"
		) {
			return null;
		}
		return { pid: parsed.pid, startedAt: parsed.startedAt };
	} catch {
		return null;
	}
}

function isProcessAlive(pid: number): boolean {
	if (pid === process.pid) return true;
	try {
		// Signal 0 doesn't actually send a signal — it just checks if the
		// process exists and we have permission to signal it.
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function lockIsStale(meta: LockMetadata | null): boolean {
	if (!meta) return true; // unparseable / corrupt
	if (Date.now() - meta.startedAt > LOCK_MAX_AGE_MS) return true;
	if (!isProcessAlive(meta.pid)) return true;
	return false;
}

function writeLockFile(lockPath: string): boolean {
	try {
		const fd = openSync(lockPath, "wx");
		try {
			writeSync(
				fd,
				JSON.stringify({ pid: process.pid, startedAt: Date.now() }),
			);
		} finally {
			closeSync(fd);
		}
		return true;
	} catch {
		return false;
	}
}

function attachCleanup(lockPath: string): void {
	let released = false;
	const release = () => {
		if (released) return;
		released = true;
		try {
			// Only remove the lock if we still own it. Avoids stomping on a
			// successor process that recovered from our stale lock.
			const meta = readLockMetadata(lockPath);
			if (!meta || meta.pid === process.pid) {
				rmSync(lockPath, { force: true });
			}
		} catch {
			/* ignore */
		}
	};
	process.on("exit", release);
	process.on("SIGINT", () => {
		release();
		process.exit(130);
	});
	process.on("SIGTERM", () => {
		release();
		process.exit(143);
	});
	process.on("uncaughtException", (err) => {
		release();
		throw err;
	});
}

/**
 * Try to acquire the build lock for this directory.
 *
 * Returns:
 *  - `"acquired"` — this process now owns the lock and should compile.
 *  - `{ status: "held", pid }` — another live process holds the lock; the
 *     caller should wait for that process's output instead of compiling.
 */
type LockResult = "acquired" | { status: "held"; pid: number };

function acquireFileLock(dir: string): LockResult {
	const lockPath = resolve(dir, ".docvia-build.lock");

	if (writeLockFile(lockPath)) {
		attachCleanup(lockPath);
		return "acquired";
	}

	// Lock contended. Inspect it: if stale, take it over.
	const meta = readLockMetadata(lockPath);
	if (lockIsStale(meta)) {
		try {
			rmSync(lockPath, { force: true });
		} catch {
			/* ignore */
		}
		if (writeLockFile(lockPath)) {
			attachCleanup(lockPath);
			return "acquired";
		}
	}

	return { status: "held", pid: meta?.pid ?? -1 };
}

/**
 * Poll for `outDir/source.ts` to appear, with a hard timeout. Used by callers
 * that lost the lock race — they need the generated module graph to exist
 * before Next.js's bundler tries to resolve `docvia/source`.
 */
async function waitForCompilerOutput(
	outDir: string,
	timeoutMs = LOCK_MAX_AGE_MS,
): Promise<boolean> {
	const target = resolve(outDir, "source.ts");
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (existsSync(target)) return true;
		await sleep(150);
	}
	return existsSync(target);
}

/**
 * Create a Next.js config wrapper that integrates docvia's compilation,
 * file-watching, and module resolution directly into the Next.js lifecycle.
 */
export function withDocvia(options: DocviaNextOptions = {}) {
	const isDev = process.env.NODE_ENV !== "production";

	return function withDocviaConfig(
		nextConfig:
			| NextConfig
			| ((
					phase: string,
					context: any,
			  ) => NextConfig | Promise<NextConfig>) = {},
	): any {
		return async (phase: string, context: any) => {
			if (!_initPromise) {
				_initPromise = init(isDev, options);
			}

			const docviaConfigInfo = await _initPromise;
			const resolvedConfig =
				typeof nextConfig === "function"
					? await nextConfig(phase, context)
					: nextConfig;
			const outDir = docviaConfigInfo
				? resolve(docviaConfigInfo.outDir ?? ".docvia")
				: resolve(".docvia");
			const sourceAlias = resolve(outDir, "source.ts");
			const registryAlias = resolve(outDir, "registry.ts");

			return {
				...resolvedConfig,
				webpack(config: any, webpackOptions: any) {
					config.resolve = config.resolve || {};
					config.resolve.alias = config.resolve.alias || {};
					config.resolve.alias["docvia/source"] = sourceAlias;
					config.resolve.alias["docvia/registry"] = registryAlias;

					return resolvedConfig.webpack?.(config, webpackOptions) ?? config;
				},
			};
		};
	};
}

async function init(
	dev: boolean,
	options: DocviaNextOptions,
): Promise<docviaConfig | null> {
	const { compile } = await import("@docvia/compiler");
	const { loadConfig, defineConfig } = await import("@docvia/plugins");
	const { docviaError } = await import("@docvia/ir");

	const configPath = resolve(options.configPath ?? "./docvia.config.ts");
	let config: docviaConfig;
	if (existsSync(configPath)) {
		config = await loadConfig(configPath);
	} else {
		config = defineConfig({});
	}

	const sourceDir = resolve(config.sourceDir ?? "docs");
	const outDir = resolve(config.outDir ?? ".docvia");
	const renderer = config.renderer;

	if (!renderer) {
		logger.warn(
			"No renderer configured in docvia.config.ts — skipping compilation.",
		);
		return config;
	}

	if (!existsSync(sourceDir)) {
		logger.warn(`Source directory not found: ${sourceDir}`);
		return config;
	}

	const lockResult = acquireFileLock(process.cwd());
	if (lockResult !== "acquired") {
		// Another live worker is compiling. Wait for its output to appear so
		// Next.js can resolve `docvia/source` after this returns. If the wait
		// times out (the holder crashed mid-compile), fall through and compile
		// ourselves — `acquireFileLock` will have updated the staleness window
		// on subsequent calls.
		logger.info(
			`Build already running in pid ${lockResult.pid}; waiting for output...`,
		);
		const ready = await waitForCompilerOutput(outDir);
		if (ready) {
			return config;
		}
		logger.warn(
			"Timed out waiting for the other process; attempting to compile here.",
		);
		const retry = acquireFileLock(process.cwd());
		if (retry !== "acquired") {
			logger.error(
				"Could not acquire build lock after timeout; giving up. Delete .docvia-build.lock to recover.",
			);
			return config;
		}
	}

	try {
		logger.info("Compiling documentation...");
		const result = await compile({
			sourceDir,
			outDir,
			renderer,
			plugins: [...(config.plugins ?? [])],
			config,
		});
		logger.success(
			`Built ${result.stats.total} files in ${Math.round(result.duration)}ms`,
		);
	} catch (err) {
		if (err instanceof docviaError) {
			logger.error(
				`Build failed: [${err.code}] ${err.message}`,
				err.file ? ` → ${err.file}` : undefined,
			);
		} else {
			logger.error("Build failed", err);
		}
		if (!dev) {
			throw err;
		}
	}

	if (dev) {
		await startDevWatcher(sourceDir, outDir, renderer, config);
	}

	return config;
}

async function startDevWatcher(
	sourceDir: string,
	outDir: string,
	renderer: NonNullable<docviaConfig["renderer"]>,
	config: docviaConfig,
): Promise<void> {
	if (_watcherCleanup) return; // singleton

	const { compile } = await import("@docvia/compiler");
	const { docviaError } = await import("@docvia/ir");
	const { watch } = await import("chokidar");

	const pending = new Set<string>();
	let timer: ReturnType<typeof setTimeout> | null = null;
	let isRebuilding = false;
	let rebuildQueued = false;

	const watcher = watch(sourceDir, {
		ignoreInitial: true,
		awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
	});

	_watcherCleanup = () => {
		logger.info("Closing file watcher");
		void watcher.close();
		_watcherCleanup = null;
	};

	process.on("exit", _watcherCleanup);
	process.on("SIGINT", () => {
		if (_watcherCleanup) _watcherCleanup();
		process.exit();
	});
	process.on("SIGTERM", () => {
		if (_watcherCleanup) _watcherCleanup();
		process.exit();
	});

	function flush() {
		if (pending.size === 0) return;
		if (isRebuilding) {
			rebuildQueued = true;
			return;
		}

		const count = pending.size;
		pending.clear();
		timer = null;
		isRebuilding = true;
		rebuildQueued = false;

		logger.info(`Rebuilding (${count} file(s) changed)...`);

		compile({
			sourceDir,
			outDir,
			renderer,
			plugins: [...(config.plugins ?? [])],
			config,
		})
			.then((r) => {
				logger.success(`Rebuilt in ${Math.round(r.duration)}ms`);
			})
			.catch((err: unknown) => {
				if (err instanceof docviaError) {
					logger.error(`Rebuild failed: [${err.code}] ${err.message}`);
				} else {
					logger.error("Rebuild error:", err);
				}
			})
			.finally(() => {
				isRebuilding = false;
				if (rebuildQueued || pending.size > 0) {
					flush();
				}
			});
	}

	function schedule(filePath: string) {
		pending.add(filePath);
		if (timer) clearTimeout(timer);
		timer = setTimeout(flush, 20);
	}

	watcher.on("change", schedule);
	watcher.on("add", schedule);
	watcher.on("unlink", schedule);

	logger.info(`Watching ${sourceDir} for changes...`);
}
