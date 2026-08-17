import type { Plugin } from "vite";
import { snippets } from "./src/lib/snippets";

// Highlights the landing-page code samples with Shiki during the build and
// serves the resulting HTML as a virtual module. The same argument docvia makes
// for docs applies here: no highlighter reaches the browser or the Worker.
//
// Dual themes emit `--shiki-light` / `--shiki-dark` custom properties per token
// rather than baked colours, so one payload serves both themes and the toggle
// costs nothing. app.css picks the side via [data-theme].

const VIRTUAL_ID = "virtual:docvia-snippets";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

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
