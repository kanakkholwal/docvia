import type { RenderOutput } from "./types";

export interface StaticHtmlOptions {
	/** Tags that must stay as nodes, e.g. ones a framework overrides (`a` -> a router link). */
	readonly keepTags?: readonly string[];
	/** Merge runs of static siblings into one `html` node (needs a renderer that injects HTML without a wrapper). */
	readonly mergeSiblings?: boolean;
}

const VOID = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
]);

const escapeText = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, "&quot;");

/** hast property names (`className`, `dataLang`, `ariaHidden`) to HTML attribute names. */
function attrName(key: string): string {
	if (key === "className") return "class";
	if (key === "htmlFor") return "for";
	if (/^(data|aria)[A-Z]/.test(key)) {
		return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
	}
	return key.toLowerCase();
}

function attributes(props: Record<string, unknown> | undefined): string {
	let out = "";
	for (const [key, value] of Object.entries(props ?? {})) {
		if (value === undefined || value === null || value === false) continue;
		const name = attrName(key);
		if (value === true) out += ` ${name}`;
		else {
			const text = Array.isArray(value) ? value.join(" ") : String(value);
			out += ` ${name}="${escapeAttr(text)}"`;
		}
	}
	return out;
}

/** Serialize a static (component-free) render tree to HTML. */
export function toHtml(node: RenderOutput): string {
	switch (node.kind) {
		case "text":
			return escapeText(node.value);
		case "html":
			return node.value;
		case "fragment":
			return node.children.map(toHtml).join("");
		case "element": {
			const open = `<${node.tag}${attributes(node.props)}>`;
			if (VOID.has(node.tag)) return open;
			return `${open}${(node.children ?? []).map(toHtml).join("")}</${node.tag}>`;
		}
		case "component":
			throw new Error("components cannot be serialized to static HTML");
	}
}

function isStatic(node: RenderOutput, keep: ReadonlySet<string>): boolean {
	switch (node.kind) {
		case "text":
		case "html":
			return true;
		case "component":
			return false;
		case "element":
			// Code blocks stay nodes so a renderer's `codeBlock` override can find them at any depth.
			return (
				!keep.has(node.tag) &&
				node.props?.["data-docvia-code"] === undefined &&
				(node.children ?? []).every((c) => isStatic(c, keep))
			);
		case "fragment":
			return node.children.every((c) => isStatic(c, keep));
	}
}

function collapseChildren(
	children: readonly RenderOutput[],
	keep: ReadonlySet<string>,
	merge: boolean,
): RenderOutput[] {
	const collapsed = children.map((c) => collapseNode(c, keep, merge));
	if (!merge) return collapsed;
	const out: RenderOutput[] = [];
	let run: RenderOutput[] = [];
	const flush = () => {
		if (run.length > 0)
			out.push({ kind: "html", value: run.map(toHtml).join("") });
		run = [];
	};
	for (const child of collapsed) {
		if (isStatic(child, keep)) run.push(child);
		else {
			flush();
			out.push(child);
		}
	}
	flush();
	return out;
}

function collapseNode(
	node: RenderOutput,
	keep: ReadonlySet<string>,
	merge: boolean,
): RenderOutput {
	switch (node.kind) {
		case "element": {
			const children = node.children ?? [];
			// Kept tags keep their children as nodes too: an override receives them unchanged.
			if (keep.has(node.tag)) return node;
			if (children.length > 0 && children.every((c) => isStatic(c, keep))) {
				// Keep the element itself, so renderers can attach props or overrides to it.
				const { id: _id, ...element } = node;
				return {
					...element,
					children: [{ kind: "html", value: children.map(toHtml).join("") }],
				};
			}
			return { ...node, children: collapseChildren(children, keep, merge) };
		}
		case "component":
			return node.children
				? { ...node, children: collapseChildren(node.children, keep, merge) }
				: node;
		case "fragment":
			return {
				kind: "fragment",
				children: collapseChildren(node.children, keep, merge),
			};
		default:
			return node;
	}
}

/**
 * Pre-render static subtrees to HTML so renderers create (and hydrate) one node per block
 * instead of one per inline element. Components always stay as nodes.
 */
export function collapseStatic(
	output: RenderOutput,
	options: StaticHtmlOptions = {},
): RenderOutput {
	return collapseNode(
		output,
		new Set(options.keepTags ?? []),
		options.mergeSiblings === true,
	);
}
