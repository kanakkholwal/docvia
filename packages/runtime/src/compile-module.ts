// The single, bundler-agnostic markdown→module transform. Every in-place
// loader calls this — the Vite `?docvia` transform and the Next.js
// webpack/Turbopack loaders — so their output matches the build pipeline
// byte-for-byte. Keeping it here (not in a plugin) is the point: the transform
// is in-house; the per-bundler loaders are thin shims that call it.
import type { docviaConfig, FileEntry } from "@docvia/ir";
import { PluginRunner } from "@docvia/plugins";
import { markdownToIR } from "./pipeline";

export interface CompiledModule {
	readonly code: string;
	readonly map: unknown;
}

export interface CompileMarkdownToModuleArgs {
	/** Raw markdown source (including frontmatter). */
	readonly code: string;
	/** Absolute path to the source file (for error messages). */
	readonly filePath: string;
	/** Path relative to `sourceDir` — determines the route slug. */
	readonly relativePath: string;
	readonly config: docviaConfig;
	/**
	 * Reuse a `PluginRunner` across calls (loaders compile one file at a time).
	 * Omit to construct one per call from `config.plugins`.
	 */
	readonly pluginRunner?: PluginRunner;
}

/**
 * Compile one markdown file's content into a renderable module exporting
 * `meta`, `content`, and `manifest`. Runs the full plugin pipeline (including
 * build-time highlighting), then the configured renderer — so swapping the
 * renderer is what makes the same loader output target any framework.
 */
export async function compileMarkdownToModule(
	args: CompileMarkdownToModuleArgs,
): Promise<CompiledModule> {
	const { code, filePath, relativePath, config } = args;
	const renderer = config.renderer;
	if (!renderer) {
		throw new Error("[docvia] No renderer configured");
	}
	const runner =
		args.pluginRunner ?? new PluginRunner([...(config.plugins ?? [])]);

	const file: FileEntry = {
		path: filePath,
		relativePath,
		content: code,
		hash: "",
	};

	const { ir } = await markdownToIR({ file, config, runner });

	const rendered = await renderer.renderPage(ir);
	return { code: rendered.code, map: rendered.map ?? null };
}
