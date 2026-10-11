// Build-time Shiki highlighting: `beforeRender` stores highlighted HTML on each `code-block`
// node, so no highlighter ships to the runtime or edge bundle.

import type { docviaPlugin, IRDocument, IRNode } from "@docvia/core";
import {
	bundledLanguages,
	type CodeOptionsThemes,
	createHighlighter,
	type Highlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const DEFAULT_THEME = "github-dark";

export interface ShikiPluginOptions {
	/** Shiki theme id. Default: "github-dark". Ignored when `themes` is set. */
	readonly theme?: string;
	/** Light and dark theme ids; tokens carry both palettes as `--shiki-light` / `--shiki-dark`. */
	readonly themes?: { readonly light: string; readonly dark: string };
	/** Shiki's `defaultColor` for `themes`. `false` emits only CSS variables, no inline color. */
	readonly defaultColor?: "light" | "dark" | false;
	/**
	 * Languages to load up front. Any other bundled Shiki language loads on first use;
	 * unknown languages render as plain text.
	 */
	readonly langs?: readonly string[];
	/**
	 * Regex engine. "oniguruma" (default, WASM) highlights about 1.6x faster in bulk; "javascript"
	 * starts in ~2 ms instead of ~140 ms and needs no WASM.
	 */
	readonly engine?: "oniguruma" | "javascript";
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
	themeOptions: CodeOptionsThemes,
): IRNode[] {
	return nodes.map((node): IRNode => {
		if (node.type === "code-block") {
			const code = String(node.props.value ?? "");
			const lang = String(node.props.lang ?? "").trim() || "text";
			let html: string;
			try {
				html = hl.codeToHtml(code, { lang, ...themeOptions });
			} catch {
				// Language not preloaded (or other Shiki error): fall back to
				// plain text so a single odd code block never breaks the build.
				html = `<pre><code>${escapeHtml(code)}</code></pre>`;
			}
			return { ...node, props: { ...node.props, html } };
		}
		if (node.children.length > 0) {
			return {
				...node,
				children: highlightTree(node.children, hl, themeOptions),
			};
		}
		return node;
	});
}

const hasCode = (nodes: readonly IRNode[]): boolean =>
	nodes.some((n) => n.type === "code-block" || hasCode(n.children));

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
	const { themes, defaultColor } = options;
	const theme = options.theme ?? DEFAULT_THEME;
	const themeOptions: CodeOptionsThemes = themes
		? { themes: { light: themes.light, dark: themes.dark }, defaultColor }
		: { theme };
	const themeIds = themes ? [themes.light, themes.dark] : [theme];
	const langs = [...new Set(options.langs ?? [])];

	// One highlighter per plugin instance, created on the first code block it sees.
	let highlighterPromise: Promise<Highlighter> | null = null;
	const getHighlighter = (): Promise<Highlighter> => {
		highlighterPromise ??= createHighlighter({
			themes: themeIds,
			langs: langs.filter((l) => l in bundledLanguages),
			...(options.engine === "javascript"
				? { engine: createJavaScriptRegexEngine({ forgiving: true }) }
				: {}),
		});
		return highlighterPromise;
	};
	const loading = new Map<string, Promise<void>>();
	const ensureLanguages = async (hl: Highlighter, nodes: readonly IRNode[]) => {
		const wanted = new Set<string>();
		const visit = (list: readonly IRNode[]) => {
			for (const n of list) {
				if (n.type === "code-block") wanted.add(String(n.props.lang ?? ""));
				visit(n.children);
			}
		};
		visit(nodes);
		const loaded = new Set(hl.getLoadedLanguages());
		await Promise.all(
			[...wanted]
				.filter((l) => l in bundledLanguages && !loaded.has(l))
				.map((l) => {
					let pending = loading.get(l);
					if (!pending) {
						pending = hl.loadLanguage(l as keyof typeof bundledLanguages);
						loading.set(l, pending);
					}
					return pending;
				}),
		);
	};

	return {
		name: "@docvia/plugin-shiki",
		version: "0.1.0",
		// Highlighting is a finishing step; run after content-shaping plugins.
		phase: "post",
		cacheKey() {
			const themeKey = themes
				? `${themes.light}+${themes.dark}+${String(defaultColor)}`
				: theme;
			return `shiki@2|${themeKey}|${options.engine ?? "oniguruma"}`;
		},
		async beforeRender(doc: IRDocument): Promise<IRDocument> {
			if (!hasCode(doc.children)) return doc;
			const hl = await getHighlighter();
			await ensureLanguages(hl, doc.children);
			return {
				...doc,
				children: highlightTree(doc.children, hl, themeOptions),
			};
		},
	};
}

export default shiki;
