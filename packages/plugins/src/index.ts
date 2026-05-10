import type {
	docviaConfig,
	docviaPlugin,
	FileEntry,
	FrontmatterData,
	HookPhase,
	IRDocument,
} from "@docvia/ir";
import { docviaError } from "@docvia/ir";
import { createJiti } from "jiti";
import { resolve } from "node:path";

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
			if (plugin.beforeParse) {
				result = await callHook(plugin, "beforeParse", file.path, () =>
					plugin.beforeParse!(result),
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
					plugin.afterParse!(result, file),
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
					plugin.beforeTransform!(result, meta),
				);
			}
		}
		return result;
	}

	async runAfterTransform(doc: IRDocument): Promise<IRDocument> {
		let result = doc;
		for (const plugin of this.plugins) {
			if (plugin.afterTransform) {
				result = await callHook(plugin, "afterTransform", undefined, () =>
					plugin.afterTransform!(result),
				);
			}
		}
		return result;
	}

	async runBeforeRender(doc: IRDocument): Promise<IRDocument> {
		let result = doc;
		for (const plugin of this.plugins) {
			if (plugin.beforeRender) {
				result = await callHook(plugin, "beforeRender", undefined, () =>
					plugin.beforeRender!(result),
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

export function defineConfig(config: Partial<docviaConfig>): docviaConfig {
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
