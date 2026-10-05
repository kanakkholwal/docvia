// biome-ignore-all lint/suspicious/noExplicitAny: webpack/Turbopack loader context is intentionally untyped.
// Webpack and Turbopack loader for the `*.md?docvia` imports in `.docvia/source.ts`:
// a thin shim over `compileMarkdownToModule`.
import { relative, resolve } from "node:path";
import type { docviaConfig } from "@docvia/ir";
import type { PluginRunner } from "@docvia/plugins";

interface LoaderOptions {
	readonly configPath?: string;
	readonly sourceDir?: string;
	readonly root?: string;
}

interface CompileContext {
	readonly config: docviaConfig;
	readonly runner: PluginRunner;
}

// Config + plugin pipeline are loaded once per config path and reused across
// every file the loader compiles in this process.
const _contexts = new Map<string, Promise<CompileContext>>();

function getContext(configPath: string, root: string): Promise<CompileContext> {
	let ctx = _contexts.get(configPath);
	if (!ctx) {
		ctx = (async () => {
			const { resolveProject, PluginRunner } = await import("@docvia/plugins");
			const { config } = await resolveProject({ cwd: root, configPath });
			const runner = new PluginRunner([...(config.plugins ?? [])]);
			return { config, runner };
		})();
		_contexts.set(configPath, ctx);
	}
	return ctx;
}

export default function docviaLoader(this: any, source: string): void {
	const callback = this.async();

	// Only docvia markdown imports carry the `?docvia` query — pass anything
	// else through untouched (e.g. a plain `.md` import elsewhere in the app).
	if (!String(this.resourceQuery ?? "").includes("docvia")) {
		callback(null, source);
		return;
	}

	const options: LoaderOptions =
		typeof this.getOptions === "function" ? this.getOptions() : {};
	const configPath = resolve(options.configPath ?? "./docvia.config.ts");
	const filePath = this.resourcePath as string;
	const collection = new URLSearchParams(
		String(this.resourceQuery ?? "").replace(/^\?/, ""),
	).get("collection");

	(async () => {
		const { compileMarkdownToModule, macroCollectionDir } = await import(
			"@docvia/runtime"
		);
		const { config, runner } = await getContext(
			configPath,
			resolve(options.root ?? process.cwd()),
		);
		// `defineDocs()` pages carry their collection; slugs are relative to its directory.
		const macroDir = collection
			? macroCollectionDir(resolve(options.root ?? process.cwd()), collection)
			: undefined;
		const sourceDir = macroDir ?? resolve(options.sourceDir ?? "docs");
		const relativePath = relative(sourceDir, filePath).replace(/\\/g, "/");
		return compileMarkdownToModule({
			code: source,
			filePath,
			relativePath,
			config,
			pluginRunner: runner,
		});
	})().then(
		({ code, map }) => callback(null, code, map ?? undefined),
		(err) => callback(err),
	);
}
