// @docvia/plugin-shiki — build-time syntax highlighting for docvia.
//
// Registers as a docvia plugin. Its `beforeRender` hook walks the document IR,
// finds every `code-block` node, and embeds Shiki-highlighted HTML on the node
// (`props.html`). Because highlighting runs at compile time, the renderer emits
// the stored HTML directly and no highlighter ships to the runtime/edge bundle.
//
// Shiki's bundled `createHighlighter` loads the Oniguruma WebAssembly grammar
// engine — highlighting is WASM-backed.

import type { docviaPlugin, IRDocument, IRNode } from "@docvia/ir";
import { createHighlighter, type Highlighter } from "shiki";

const DEFAULT_THEME = "github-dark";
const DEFAULT_LANGS = [
	"javascript",
	"typescript",
	"tsx",
	"jsx",
	"bash",
	"json",
	"css",
	"html",
	"svelte",
	"markdown",
];

export interface ShikiPluginOptions {
	/** Shiki theme id. Default: "github-dark". */
	readonly theme?: string;
	/**
	 * Languages to preload. Fenced code blocks in any other language fall back
	 * to plain (un-highlighted) text rather than failing the build.
	 */
	readonly langs?: readonly string[];
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Recursively map the IR, replacing each `code-block` node with a copy whose
 * `props.html` holds the highlighted markup. Non-code nodes are returned
 * unchanged (structural sharing) unless a descendant changed.
 */
function highlightTree(
	nodes: readonly IRNode[],
	hl: Highlighter,
	theme: string,
): IRNode[] {
	return nodes.map((node): IRNode => {
		if (node.type === "code-block") {
			const code = String(node.props.value ?? "");
			const lang = String(node.props.lang ?? "").trim() || "text";
			let html: string;
			try {
				html = hl.codeToHtml(code, { lang, theme });
			} catch {
				// Language not preloaded (or other Shiki error) — fall back to
				// plain text so a single odd code block never breaks the build.
				html = `<pre><code>${escapeHtml(code)}</code></pre>`;
			}
			return { ...node, props: { ...node.props, html } };
		}
		if (node.children.length > 0) {
			return { ...node, children: highlightTree(node.children, hl, theme) };
		}
		return node;
	});
}

/**
 * Create the docvia Shiki highlighting plugin.
 *
 * @example
 * ```ts
 * import { shiki } from "@docvia/plugin-shiki";
 * export default defineConfig({ plugins: [shiki({ theme: "github-dark" })] });
 * ```
 */
export function shiki(options: ShikiPluginOptions = {}): docviaPlugin {
	const theme = options.theme ?? DEFAULT_THEME;
	const langs = [...new Set(options.langs ?? DEFAULT_LANGS)];

	// The Shiki highlighter is expensive to create — build it once, lazily, and
	// share the promise across every document in the compile run.
	let highlighterPromise: Promise<Highlighter> | null = null;
	const getHighlighter = (): Promise<Highlighter> => {
		highlighterPromise ??= createHighlighter({ themes: [theme], langs });
		return highlighterPromise;
	};

	return {
		name: "@docvia/plugin-shiki",
		version: "0.1.0",
		// Highlighting is a finishing step — run after content-shaping plugins.
		phase: "post",
		// Theme/langs feed the incremental cache key: changing either invalidates
		// every cached document so code blocks are re-highlighted.
		cacheKey() {
			return `shiki@1|${theme}|${[...langs].sort().join(",")}`;
		},
		async beforeRender(doc: IRDocument): Promise<IRDocument> {
			const hl = await getHighlighter();
			return { ...doc, children: highlightTree(doc.children, hl, theme) };
		},
	};
}

export default shiki;
