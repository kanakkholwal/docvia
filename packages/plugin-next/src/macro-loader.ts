// biome-ignore-all lint/suspicious/noExplicitAny: webpack/Turbopack loader context is intentionally untyped.
import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { PagePipeline } from "@docvia/runtime";

interface LoaderOptions {
	readonly configPath?: string;
	readonly root?: string;
}

// Next re-runs this loader on every page edit, so state lives for the process: the pipeline's
// frontmatter cache makes a rescan parse only changed files.
const pipelines = new Map<
	string,
	{ version: number; pending: Promise<PagePipeline> }
>();
const evaluations = new Map<string, Promise<unknown>>();

/** One pipeline per config file version, so a config edit in dev applies without a restart. */
function pipelineFor(configPath: string, root: string): Promise<PagePipeline> {
	const key = `${configPath}\0${root}`;
	const version = statSync(configPath, { throwIfNoEntry: false })?.mtimeMs ?? 0;
	const cached = pipelines.get(key);
	if (cached?.version === version) return cached.pending;
	const pending = (async () => {
		const [{ resolveProject }, { PagePipeline }] = await Promise.all([
			import("@docvia/plugins"),
			import("@docvia/runtime"),
		]);
		const { config } = await resolveProject({ cwd: root, configPath });
		return new PagePipeline(config, root);
	})();
	pending.catch(() => pipelines.delete(key));
	pipelines.set(key, { version, pending });
	return pending;
}

/** Evaluates the module once per distinct source text; a page edit does not change it. */
function evaluateOnce<T>(
	file: string,
	source: string,
	run: () => Promise<T>,
): Promise<T> {
	const key = `${file}\0${createHash("sha1").update(source).digest("hex")}`;
	let pending = evaluations.get(key) as Promise<T> | undefined;
	if (!pending) {
		for (const k of evaluations.keys())
			if (k.startsWith(`${file}\0`)) evaluations.delete(k);
		pending = run();
		pending.catch(() => evaluations.delete(key));
		evaluations.set(key, pending);
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

	if (existsSync(configPath)) this.addDependency?.(configPath);
	(async () => {
		const runtime = await import("@docvia/runtime");
		const pipeline = await pipelineFor(configPath, root);
		return runtime.transformMacroModule(source, file, {
			root,
			config: pipeline.config,
			emit: { kind: "explicit" },
			evaluate: () =>
				evaluateOnce(file, source, () =>
					runtime.collectMacroOptions(root, async () => {
						const { createJiti } = await import("jiti");
						await createJiti(file, {
							moduleCache: false,
							fsCache: false,
						}).import(file);
					}),
				),
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
