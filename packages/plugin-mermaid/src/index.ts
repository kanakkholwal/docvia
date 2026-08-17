// @docvia/plugin-mermaid — Mermaid diagrams for docvia.
import type { docviaPlugin, IRDocument, IRNode } from "@docvia/ir";

const DEFAULT_LANG = "mermaid";
const DEFAULT_COMPONENT = "Mermaid";

export interface MermaidPluginOptions {
	/**
	 * Fence info string that marks a diagram. Default: "mermaid".
	 * Set this when your Markdown uses a different tag, e.g. "diagram".
	 */
	readonly lang?: string;
	/**
	 * Component name emitted into the IR. It must match the key the host app
	 * registers in its renderer ComponentRegistry. Default: "Mermaid".
	 */
	readonly component?: string;
	/**
	 * Extra props passed to every diagram component, merged under the props
	 * derived from the fence itself.
	 */
	readonly props?: Readonly<Record<string, unknown>>;
}

const TITLE_COMMENT = /^\s*%%\s*title:\s*(.+?)\s*$/;

/**
 * Pull a caption off a leading `%% title: …` line. `%%` is Mermaid's own
 * comment syntax, so the diagram still renders if the plugin is not installed.
 * The fence meta string can't be used: @docvia/ir drops it before the IR.
 */
function parseCode(raw: string): { code: string; title?: string } {
	const lines = raw.trim().split("\n");
	const match = lines.length > 0 ? TITLE_COMMENT.exec(lines[0]) : null;
	if (!match) return { code: raw.trim() };
	return { code: lines.slice(1).join("\n").trim(), title: match[1] };
}

function rewriteTree(
	nodes: readonly IRNode[],
	lang: string,
	component: string,
	extraProps: Readonly<Record<string, unknown>>,
): IRNode[] {
	return nodes.map((node): IRNode => {
		if (node.type === "code-block") {
			if (String(node.props.lang ?? "").trim() !== lang) return node;

			const { code, title } = parseCode(String(node.props.value ?? ""));
			return {
				type: "component",
				// Reuse the code block's id so hydration ids stay stable across
				// edits that don't touch the diagram.
				id: node.id,
				props: {
					name: component,
					hydrate: "none",
					attributes: { ...extraProps, code, title },
				},
				children: [],
			};
		}
		if (node.children.length > 0) {
			return {
				...node,
				children: rewriteTree(node.children, lang, component, extraProps),
			};
		}
		return node;
	});
}

/**
 * Create the docvia Mermaid plugin.
 *
 * @example
 * ```ts
 * import { mermaid } from "@docvia/plugin-mermaid";
 * export default defineConfig({ plugins: [mermaid()] });
 * ```
 */
export function mermaid(options: MermaidPluginOptions = {}): docviaPlugin {
	const lang = options.lang ?? DEFAULT_LANG;
	const component = options.component ?? DEFAULT_COMPONENT;
	const extraProps = options.props ?? {};

	return {
		name: "@docvia/plugin-mermaid",
		version: "0.1.0",
		// Run before highlighters so a diagram fence never reaches Shiki.
		phase: "pre",
		cacheKey() {
			return `mermaid@1|${lang}|${component}|${JSON.stringify(extraProps)}`;
		},
		async beforeRender(doc: IRDocument): Promise<IRDocument> {
			return {
				...doc,
				children: rewriteTree(doc.children, lang, component, extraProps),
			};
		},
	};
}

export default mermaid;
