// biome-ignore-all lint/suspicious/noExplicitAny: webpack/Turbopack loader context is intentionally untyped.
import { resolve } from "node:path";
import type { docviaConfig } from "@docvia/ir";

interface LoaderOptions {
	readonly configPath?: string;
	readonly root?: string;
}

const configs = new Map<string, Promise<docviaConfig>>();

function loadConfig(configPath: string, root: string): Promise<docviaConfig> {
	let pending = configs.get(configPath);
	if (!pending) {
		pending = import("@docvia/plugins")
			.then((m) => m.resolveProject({ cwd: root, configPath }))
			.then((p) => p.config);
		configs.set(configPath, pending);
	}
	return pending;
}

/** Rewrites `defineDocs()` like the Vite plugin, but with explicit lazy imports (no `import.meta.glob`). */
export default function docviaMacroLoader(this: any, source: string): void {
	const callback = this.async();
	if (!source.includes("@docvia/source/macro")) {
		callback(null, source);
		return;
	}
	const options: LoaderOptions =
		typeof this.getOptions === "function" ? this.getOptions() : {};
	const root = resolve(options.root ?? process.cwd());
	const configPath = resolve(root, options.configPath ?? "./docvia.config.ts");
	const file = this.resourcePath as string;

	(async () => {
		const runtime = await import("@docvia/runtime");
		const config = await loadConfig(configPath, root);
		const pipeline = new runtime.PagePipeline(config, root);
		return runtime.transformMacroModule(source, file, {
			root,
			config,
			emit: { kind: "explicit" },
			evaluate: () =>
				runtime.collectMacroOptions(root, async () => {
					const { createJiti } = await import("jiti");
					await createJiti(file, { moduleCache: false, fsCache: false }).import(
						file,
					);
				}),
			index: async (def) => {
				const collection = pipeline.registerCollection(def);
				const pages = await runtime.scanCollection(pipeline, collection);
				// Frontmatter edits and new pages must re-run this loader.
				this.addContextDependency?.(def.dir);
				for (const page of pages) this.addDependency?.(page.absPath);
				return Object.fromEntries(pages.map((p) => [p.relativePath, p.meta]));
			},
		});
	})().then(
		(result) =>
			result ? callback(null, result.code, result.map) : callback(null, source),
		(err) => callback(err),
	);
}
