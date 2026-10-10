import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { docviaConfig, docviaPlugin } from "@docvia/core";
import { defineConfig, docviaError } from "@docvia/core";
import { createJiti } from "jiti";

export async function loadConfig(configPath: string): Promise<docviaConfig> {
	const resolved = resolve(configPath);
	let mod: unknown;
	try {
		const jiti = createJiti(import.meta.url, {
			moduleCache: false,
			fsCache: false,
		});
		mod = await jiti.import(resolved);
	} catch (err) {
		throw new docviaError(
			"CONFIG_ERROR",
			`Failed to load config: ${resolved}\n  ${(err as Error).message}`,
			resolved,
			undefined,
			err as Error,
		);
	}

	const rawConfig =
		mod && typeof mod === "object" && "default" in (mod as object)
			? (mod as { default: unknown }).default
			: mod;

	if (!rawConfig || typeof rawConfig !== "object") {
		throw new docviaError(
			"CONFIG_ERROR",
			`Config file did not export an object (got ${typeof rawConfig}). Did you forget \`export default defineConfig({...})\`?`,
			resolved,
		);
	}

	return defineConfig(rawConfig as Partial<docviaConfig>);
}

// Config discovery

/** Conventional config filenames, in resolution order. */
export const CONFIG_BASENAMES = [
	"docvia.config.ts",
	"docvia.config.mts",
	"docvia.config.cts",
	"docvia.config.js",
	"docvia.config.mjs",
	"docvia.config.cjs",
];

/**
 * Resolve the docvia config file path. An explicit path (relative to `cwd` or
 * absolute) wins and is returned as-is — even if missing — so callers can decide
 * how to treat an absent explicit path. `false` opts out. Otherwise the
 * conventional `docvia.config.*` in `cwd` is auto-detected, returning `undefined`
 * when none exists.
 */
export function resolveConfigPath(
	cwd: string,
	explicit?: string | false,
): string | undefined {
	if (explicit === false) return undefined;
	if (explicit) return resolve(cwd, explicit);
	for (const name of CONFIG_BASENAMES) {
		const candidate = resolve(cwd, name);
		if (existsSync(candidate)) return candidate;
	}
	return undefined;
}

export interface ResolveProjectOptions {
	/** Directory to resolve a relative/auto-detected config against. Default: cwd. */
	readonly cwd?: string;
	/** Explicit config path, or `false` to skip discovery. */
	readonly configPath?: string | false;
	/** Throw a `CONFIG_ERROR` when no config file is found instead of using defaults. */
	readonly required?: boolean;
}

export interface ResolvedProject {
	readonly config: docviaConfig;
	/** Absolute path to the loaded config file; `undefined` when defaults are used. */
	readonly configPath?: string;
	/** `dirname(configPath)` when a config was found, otherwise `cwd`. */
	readonly projectRoot: string;
}

/**
 * Discover, load, and locate the project config in one call — the single owner
 * of "where is the config, what's in it, and what's the project root". When no
 * config file is found it throws (if `required`) or returns built-in defaults
 * rooted at `cwd`. Every entry point (CLI, framework plugins, search) resolves
 * config through here so discovery and defaults stay consistent.
 */
export async function resolveProject(
	options: ResolveProjectOptions = {},
): Promise<ResolvedProject> {
	const cwd = resolve(options.cwd ?? process.cwd());
	const configPath = resolveConfigPath(cwd, options.configPath);

	if (!configPath || !existsSync(configPath)) {
		if (options.required) {
			throw new docviaError(
				"CONFIG_ERROR",
				`docvia config not found${
					configPath ? `: ${configPath}` : ` in ${cwd}`
				}\n  Expected one of: ${CONFIG_BASENAMES.join(", ")}.`,
				configPath,
			);
		}
		const config = await withDetectedDefaults(defineConfig({}), cwd, false);
		return { config, projectRoot: cwd };
	}

	const projectRoot = dirname(configPath);
	const config = await withDetectedDefaults(
		await loadConfig(configPath),
		projectRoot,
		true,
	);
	return { config, configPath, projectRoot };
}

/** Imports `specifier` as the project at `root` would, or `undefined` when it is not installed. */
async function importFromProject(
	root: string,
	specifier: string,
): Promise<Record<string, unknown> | undefined> {
	let path: string;
	try {
		path = createRequire(join(root, "package.json")).resolve(specifier);
	} catch {
		return undefined;
	}
	return import(pathToFileURL(path).href);
}

function projectDependencies(root: string): Set<string> {
	try {
		const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
		return new Set(
			Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }),
		);
	} catch {
		return new Set();
	}
}

/**
 * Zero-config defaults: the renderer matching the app's framework and, without a config
 * file, Shiki when `@docvia/plugin-shiki` is installed.
 */
async function withDetectedDefaults(
	config: docviaConfig,
	root: string,
	hasConfigFile: boolean,
): Promise<docviaConfig> {
	let renderer = config.renderer;
	if (!renderer) {
		const deps = projectDependencies(root);
		const svelte = deps.has("svelte") || deps.has("@sveltejs/kit");
		const mod = svelte
			? await importFromProject(root, "@docvia/core/svelte/node")
			: await importFromProject(root, "@docvia/core/react");
		const create = (
			svelte ? mod?.createSvelteRenderer : mod?.createReactRenderer
		) as (() => docviaConfig["renderer"]) | undefined;
		renderer = create?.();
	}
	let plugins = config.plugins;
	if (!hasConfigFile && plugins.length === 0) {
		const shiki = await importFromProject(root, "@docvia/plugin-shiki");
		const create = shiki?.shiki as (() => docviaPlugin) | undefined;
		if (create) plugins = [create()];
	}
	return { ...config, renderer, plugins };
}
