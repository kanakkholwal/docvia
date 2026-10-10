import type { HydrationMode } from "../ir/index";
import { RenderError } from "./errors";
import { renderNodes } from "./render";
import type { NodeRenderer, RendererMap, RenderOutput } from "./types";

let warnedUnhighlighted = false;

/** Appended to every code block; `installCopyButtons()` from `@docvia/core/render/client` wires it. */
export const COPY_BUTTON_HTML =
	'<button type="button" class="docvia-copy" data-docvia-copy aria-label="Copy code">Copy</button>';

const copyButton: RenderOutput = { kind: "html", value: COPY_BUTTON_HTML };

/** Wrap a titled block: ```ts title="a.ts" -> figure > figcaption + block. */
function withTitle(block: RenderOutput, title: unknown): RenderOutput {
	if (typeof title !== "string" || title === "") return block;
	return {
		kind: "element",
		tag: "figure",
		props: { class: "docvia-code-figure" },
		children: [
			{
				kind: "element",
				tag: "figcaption",
				props: { class: "docvia-code-title" },
				children: [{ kind: "text", value: title }],
			},
			block,
		],
	};
}

const renderCodeBlock: NodeRenderer = async (n, ctx) => {
	// Highlighted at build time (e.g. @docvia/plugin-shiki): emit the stored HTML.
	const prehighlighted = n.props.html;
	if (typeof prehighlighted === "string") {
		return {
			kind: "element",
			tag: "div",
			props: { class: "docvia-code-block", "data-docvia-code": "" },
			children: [{ kind: "html", value: prehighlighted + COPY_BUTTON_HTML }],
			id: n.id,
		};
	}
	if (!ctx.highlighter && !warnedUnhighlighted) {
		warnedUnhighlighted = true;
		console.warn(
			"[docvia] Code blocks are rendering without syntax highlighting. Add `shiki()` from @docvia/plugin-shiki to `plugins`.",
		);
	}
	if (!ctx.highlighter) {
		return {
			kind: "element",
			tag: "pre",
			props: { class: "docvia-code-block", "data-docvia-code": "" },
			children: [
				{
					kind: "element",
					tag: "code",
					props: n.props.lang ? { "data-lang": n.props.lang as string } : {},
					children: [{ kind: "text", value: n.props.value as string }],
				},
				copyButton,
			],
			id: n.id,
		};
	}
	try {
		const res = await ctx.highlighter.highlight(
			n.props.value as string,
			(n.props.lang as string) || "",
		);
		return {
			kind: "element",
			tag: "div",
			props: { class: "docvia-code-block", "data-docvia-code": "" },
			children: [{ kind: "html", value: res.html + COPY_BUTTON_HTML }],
			id: n.id,
		};
	} catch (e) {
		ctx.onError?.(new RenderError("HIGHLIGHT_ERROR", String(e), n));
		return {
			kind: "element",
			tag: "pre",
			children: [{ kind: "text", value: n.props.value as string }],
			id: n.id,
		};
	}
};

export function createDefaultRendererMap(): RendererMap {
	const defaultMap = {} as RendererMap;

	const map: RendererMap = {
		paragraph: async (n, ctx) => ({
			kind: "element",
			tag: "p",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		heading: async (n, ctx) => ({
			kind: "element",
			tag: `h${n.props.depth}`,
			props: { id: n.props.id },
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		text: async (n) => ({ kind: "text", value: n.props.value as string }),

		emphasis: async (n, ctx) => ({
			kind: "element",
			tag: "em",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		strong: async (n, ctx) => ({
			kind: "element",
			tag: "strong",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		"code-block": async (n, ctx) =>
			withTitle(await renderCodeBlock(n, ctx), n.props.title),

		// Tabs as plain markup; `@docvia/core/render/client` switches them in the browser.
		"code-group": async (n, ctx) => {
			const tabs = (n.props.tabs as string[] | undefined) ?? [];
			const panels = await renderNodes(n.children, defaultMap, ctx);
			return {
				kind: "element",
				tag: "div",
				props: { class: "docvia-code-group", "data-docvia-code-group": "" },
				id: n.id,
				children: [
					{
						kind: "element",
						tag: "div",
						props: { class: "docvia-code-tabs", role: "tablist" },
						children: tabs.map((label, i) => ({
							kind: "element",
							tag: "button",
							props: {
								type: "button",
								role: "tab",
								"aria-selected": i === 0 ? "true" : "false",
								"data-tab": String(i),
							},
							children: [{ kind: "text", value: label }],
						})),
					},
					...panels.map(
						(panel, i): RenderOutput => ({
							kind: "element",
							tag: "div",
							props: {
								class: "docvia-code-panel",
								role: "tabpanel",
								"data-tab": String(i),
								...(i > 0 ? { hidden: true } : {}),
							},
							children: [panel],
						}),
					),
				],
			};
		},

		"inline-code": async (n) => ({
			kind: "element",
			tag: "code",
			children: [{ kind: "text", value: n.props.value as string }],
		}),

		image: async (n) => ({
			kind: "element",
			tag: "img",
			props: { src: n.props.src, alt: n.props.alt, title: n.props.title },
		}),

		link: async (n, ctx) => ({
			kind: "element",
			tag: "a",
			props: { href: n.props.href, title: n.props.title },
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		list: async (n, ctx) => ({
			kind: "element",
			tag: n.props.ordered ? "ol" : "ul",
			props: n.props.ordered ? { start: n.props.start } : {},
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		"list-item": async (n, ctx) => ({
			kind: "element",
			tag: "li",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		table: async (n, ctx) => ({
			kind: "element",
			tag: "table",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		"table-row": async (n, ctx) => ({
			kind: "element",
			tag: "tr",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		"table-cell": async (n, ctx) => ({
			kind: "element",
			tag: (n.props.tag as string | undefined) === "th" ? "th" : "td",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		blockquote: async (n, ctx) => ({
			kind: "element",
			tag: "blockquote",
			children: await renderNodes(n.children, defaultMap, ctx),
		}),

		"thematic-break": async () => ({
			kind: "element",
			tag: "hr",
		}),

		component: async (node, ctx) => {
			const name = node.props.name as string;
			const resolved = ctx.registry.resolve(name);
			const hydrate = (node.props.hydrate as HydrationMode) ?? "none";
			const attributes =
				(node.props.attributes as Record<string, unknown>) ?? {};
			const mergedProps = resolved
				? { ...resolved.defaultProps, ...attributes }
				: attributes;

			return {
				kind: "component",
				name,
				props: mergedProps,
				hydrate,
				// biome-ignore lint/style/noNonNullAssertion: IR transform always assigns ids to component nodes (see transform.ts)
				id: node.id!,
				children: await renderNodes(node.children, defaultMap, ctx),
			};
		},

		"component-inline": async (node, ctx) => {
			const name = node.props.name as string;
			const resolved = ctx.registry.resolve(name);
			const hydrate = (node.props.hydrate as HydrationMode) ?? "none";
			const attributes =
				(node.props.attributes as Record<string, unknown>) ?? {};
			const mergedProps = resolved
				? { ...resolved.defaultProps, ...attributes }
				: attributes;

			return {
				kind: "component",
				name,
				props: mergedProps,
				hydrate,
				// biome-ignore lint/style/noNonNullAssertion: IR transform always assigns ids to component nodes (see transform.ts)
				id: node.id!,
				children: [],
			};
		},

		unknown: async (n) => ({
			kind: "element",
			tag: "div",
			props: { "data-unknown-type": n.props.originalType },
			children: [
				{ kind: "text", value: `Unknown node type: ${n.props.originalType}` },
			],
		}),

		element: async (n, ctx) => {
			const { tag, ...rest } = n.props;
			return {
				kind: "element",
				tag: tag as string,
				props: rest,
				children: await renderNodes(n.children, defaultMap, ctx),
			};
		},
	};

	Object.assign(defaultMap, map);
	return defaultMap;
}
