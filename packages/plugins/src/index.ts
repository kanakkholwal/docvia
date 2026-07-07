import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
	docviaConfig,
	docviaPlugin,
	FileEntry,
	FrontmatterData,
	FrontmatterSchema,
	HookPhase,
	IRDocument,
} from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { createJiti } from "jiti";

// Plugin Resolution

export function resolvePlugins(
	plugins: readonly docviaPlugin[],
): readonly docviaPlugin[] {
	const names = new Set<string>();

	for (const p of plugins) {
		if (!p.name) {
			throw new docviaError("PLUGIN_ERROR", "Plugin missing name");
		}
		if (!p.version) {
			throw new docviaError(
				"PLUGIN_ERROR",
				`Plugin "${p.name}" missing version`,
			);
		}
		if (names.has(p.name)) {
			throw new docviaError("PLUGIN_ERROR", `Duplicate plugin: "${p.name}"`);
		}
		names.add(p.name);
	}

	return [...plugins].sort((a, b) => {
		const phaseOrder: Record<HookPhase, number> = {
			pre: 0,
			normal: 1,
			post: 2,
		};
		const pa = phaseOrder[a.phase ?? "normal"];
		const pb = phaseOrder[b.phase ?? "normal"];
		return pa !== pb ? pa - pb : (a.priority ?? 100) - (b.priority ?? 100);
	});
}

// Plugin Runner

/**
 * Wrap a plugin hook invocation so any thrown error carries the originating
 * plugin's name+version+hook in the resulting docviaError.
 */
async function callHook<T>(
	plugin: docviaPlugin,
	hook: string,
	file: string | undefined,
	fn: () => Promise<T> | T,
): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		if (err instanceof docviaError) throw err;
		const e = err as Error;
		throw new docviaError(
			"PLUGIN_ERROR",
			`Plugin "${plugin.name}@${plugin.version}" failed in ${hook}: ${e?.message ?? String(err)}`,
			file,
			undefined,
			e,
		);
	}
}

export class PluginRunner {
	private readonly plugins: readonly docviaPlugin[];

	constructor(plugins: readonly docviaPlugin[]) {
		this.plugins = resolvePlugins(plugins);
	}

	async runBeforeParse(file: FileEntry): Promise<FileEntry> {
		let result = file;
		for (const plugin of this.plugins) {
			const hook = plugin.beforeParse;
			if (hook) {
				result = await callHook(plugin, "beforeParse", file.path, () =>
					hook(result),
				);
			}
		}
		return result;
	}

	async runAfterParse(ast: unknown, file: FileEntry): Promise<unknown> {
		let result = ast;
		for (const plugin of this.plugins) {
			if (plugin.afterParse) {
				result = await callHook(plugin, "afterParse", file.path, () =>
					plugin.afterParse?.(result, file),
				);
			}
		}
		return result;
	}

	async runBeforeTransform(
		ast: unknown,
		meta: FrontmatterData,
	): Promise<unknown> {
		let result = ast;
		for (const plugin of this.plugins) {
			if (plugin.beforeTransform) {
				result = await callHook(plugin, "beforeTransform", undefined, () =>
					plugin.beforeTransform?.(result, meta),
				);
			}
		}
		return result;
	}

	async runAfterTransform(doc: IRDocument): Promise<IRDocument> {
		let result = doc;
		for (const plugin of this.plugins) {
			const hook = plugin.afterTransform;
			if (hook) {
				result = await callHook(plugin, "afterTransform", undefined, () =>
					hook(result),
				);
			}
		}
		return result;
	}

	async runBeforeRender(doc: IRDocument): Promise<IRDocument> {
		let result = doc;
		for (const plugin of this.plugins) {
			const hook = plugin.beforeRender;
			if (hook) {
				result = await callHook(plugin, "beforeRender", undefined, () =>
					hook(result),
				);
			}
		}
		return result;
	}

	getPluginCacheKeys(): string[] {
		return this.plugins.map((p) => p.cacheKey?.() ?? `${p.name}@${p.version}`);
	}
}

// Config Loader

/**
 * Define a docvia config with full type inference. The generic `F` preserves
 * the concrete frontmatter schema type (Zod, Valibot, ArkType, …) on the
 * returned config so the generated `types.d.ts` can infer a precise
 * `Frontmatter` type from `typeof import('./docvia.config').default.frontmatter`.
 */
export function defineConfig<
	const F extends FrontmatterSchema = FrontmatterSchema,
>(
	config: Partial<Omit<docviaConfig, "frontmatter">> & { frontmatter?: F },
): docviaConfig & { readonly frontmatter?: F } {
	return {
		sourceDir: config.sourceDir ?? "docs",
		outDir: config.outDir ?? ".docvia",
		plugins: config.plugins ?? [],
		renderer: config.renderer,
		components: config.components,
		collections: config.collections,
		frontmatter: config.frontmatter,
		markdown: {
			remarkPlugins: config.markdown?.remarkPlugins ?? [],
		},
		syntax: {
			highlighter: config.syntax?.highlighter ?? "shiki",
			theme: config.syntax?.theme ?? "github-dark",
			langs: config.syntax?.langs ?? [
				"javascript",
				"typescript",
				"bash",
				"json",
				"css",
				"html",
				"svelte",
			],
		},
		theme: {
			name: config.theme?.name ?? "default",
			options: config.theme?.options ?? {},
		},
	};
}

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
		return { config: defineConfig({}), projectRoot: cwd };
	}

	const config = await loadConfig(configPath);
	return { config, configPath, projectRoot: dirname(configPath) };
}
