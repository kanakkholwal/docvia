// biome-ignore-all lint/suspicious/noExplicitAny: webpack/Turbopack loader context is intentionally untyped.
// Webpack and Turbopack loader for the `*.md?docvia` imports in `.docvia/source.ts`:
// a thin shim over `compileMarkdownToModule`.
import { relative, resolve } from "node:path";
import type { docviaConfig } from "@docvia/ir";
import type { PluginRunner } from "@docvia/plugins";

interface LoaderOptions {
	readonly configPath?: string;
	readonly sourceDir?: string;
}

interface CompileContext {
	readonly config: docviaConfig;
	readonly runner: PluginRunner;
}

// Config + plugin pipeline are loaded once per config path and reused across
// every file the loader compiles in this process.
const _contexts = new Map<string, Promise<CompileContext>>();

function getContext(configPath: string): Promise<CompileContext> {
	let ctx = _contexts.get(configPath);
	if (!ctx) {
		ctx = (async () => {
			const { loadConfig, PluginRunner } = await import("@docvia/plugins");
			const config = await loadConfig(configPath);
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
	const sourceDir = resolve(options.sourceDir ?? "docs");
	const filePath = this.resourcePath as string;

	(async () => {
		const { compileMarkdownToModule } = await import("@docvia/runtime");
		const { config, runner } = await getContext(configPath);
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
