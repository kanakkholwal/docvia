import type { Plugin } from "vite";
import { snippets } from "./src/lib/snippets.ts";

// Highlights landing-page snippets at build with dual themes (--shiki-light / --shiki-dark),
// so neither the browser nor the Worker ships a highlighter.
const VIRTUAL_ID = "virtual:docvia-snippets";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

let shared: ReturnType<typeof import("shiki").createHighlighter> | undefined;

/** Build-time highlighting in the site's dual theme; languages load on first use. */
export async function highlight(code: string, lang: string): Promise<string> {
	shared ??= import("shiki").then((m) =>
		m.createHighlighter({ themes: ["github-light", "github-dark"], langs: [] }),
	);
	const highlighter = await shared;
	if (lang !== "text" && !highlighter.getLoadedLanguages().includes(lang))
		await highlighter.loadLanguage(
			lang as Parameters<typeof highlighter.loadLanguage>[0],
		);
	return highlighter.codeToHtml(code, {
		lang,
		themes: { light: "github-light", dark: "github-dark" },
		defaultColor: false,
	});
}

export function highlightedSnippets(): Plugin {
	let cache: string | null = null;

	async function build(): Promise<string> {
		const { createHighlighter } = await import("shiki");
		const entries = Object.entries(snippets);
		const highlighter = await createHighlighter({
			themes: ["github-light", "github-dark"],
			langs: [...new Set(entries.map(([, s]) => s.lang))],
		});

		const rendered: Record<string, string> = {};
		for (const [name, snippet] of entries) {
			rendered[name] = highlighter.codeToHtml(snippet.code, {
				lang: snippet.lang,
				themes: { light: "github-light", dark: "github-dark" },
				defaultColor: false,
			});
		}
		highlighter.dispose();

		return `export const highlighted = ${JSON.stringify(rendered)};`;
	}

	return {
		name: "docvia-snippets",
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
			return undefined;
		},
		async load(id) {
			if (id !== RESOLVED_ID) return undefined;
			cache ??= await build();
			return cache;
		},
		handleHotUpdate({ file, server }) {
			if (!file.endsWith("src/lib/snippets.ts")) return;
			cache = null;
			const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
			if (mod) server.moduleGraph.invalidateModule(mod);
			server.ws.send({ type: "full-reload" });
		},
	};
}
