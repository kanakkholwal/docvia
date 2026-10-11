import type { Attributes, Block, Inline, Root } from "./ast";
import { type ParseOptions, parse } from "./block";
import { escapeHtml } from "./util";

/** Renders a directive; `children` is its content already rendered to HTML. */
export type DirectiveRenderer = (node: {
	name: string;
	attributes: Attributes;
	label: string;
	children: string;
	inline: boolean;
}) => string;

export interface HtmlOptions extends ParseOptions {
	/** Rewrites or rejects URLs; return "" to drop one. Default allows http(s), mailto, tel, irc(s), xmpp and relative. */
	urlTransform?: (url: string, kind: "href" | "src") => string;
	/** Highlighted markup for a code block, or undefined to print it plain. */
	highlight?: (code: string, lang: string, meta: string) => string | undefined;
	/** Directive renderers by name; others render as `<div data-directive="name">`. */
	directiveComponents?: Record<string, DirectiveRenderer>;
}

const SAFE_PROTOCOL = /^(?:https?|ircs?|mailto|xmpp|tel)$/i;

/** react-markdown's default policy: known protocols and relative URLs pass, anything else becomes "". */
export function defaultUrlTransform(url: string): string {
	const colon = url.indexOf(":");
	const question = url.indexOf("?");
	const hash = url.indexOf("#");
	const slash = url.indexOf("/");
	if (
		colon === -1 ||
		(slash !== -1 && colon > slash) ||
		(question !== -1 && colon > question) ||
		(hash !== -1 && colon > hash) ||
		SAFE_PROTOCOL.test(url.slice(0, colon))
	)
		return url;
	return "";
}

const attrs = (attributes: Attributes) =>
	Object.entries(attributes)
		.map(
			([k, v]) =>
				` ${/^[a-zA-Z_:][\w:.-]*$/.test(k) ? k : "data-invalid"}="${escapeHtml(v)}"`,
		)
		.join("");

/** Renders Markdown, or a tree from `parse()`, to an HTML string. */
export function toHtml(
	input: string | Root,
	options: HtmlOptions = {},
): string {
	const root = typeof input === "string" ? parse(input, options) : input;
	return renderBlocks(root.children, options);
}

/** Renders parsed blocks, e.g. one block of a stream at a time. */
export function renderBlocks(
	nodes: Block[],
	options: HtmlOptions = {},
): string {
	const url = options.urlTransform ?? defaultUrlTransform;
	const components = options.directiveComponents ?? {};

	const directive = (
		name: string,
		attributes: Attributes,
		label: string,
		children: string,
		inline: boolean,
	) => {
		const custom = components[name];
		if (custom) return custom({ name, attributes, label, children, inline });
		const tag = inline ? "span" : "div";
		return `<${tag} data-directive="${escapeHtml(name)}"${attrs(attributes)}>${label && !inline ? `<p>${label}</p>\n` : ""}${children}</${tag}>`;
	};

	const inlines = (nodes: Inline[]): string => nodes.map(inlineNode).join("");
	function inlineNode(n: Inline): string {
		switch (n.type) {
			case "text":
				return escapeHtml(n.value);
			case "emphasis":
				return `<em>${inlines(n.children)}</em>`;
			case "strong":
				return `<strong>${inlines(n.children)}</strong>`;
			case "delete":
				return `<del>${inlines(n.children)}</del>`;
			case "code":
				return `<code>${escapeHtml(n.value)}</code>`;
			case "break":
				return "<br />\n";
			case "html":
				return n.value;
			case "link": {
				const title = n.title ? ` title="${escapeHtml(n.title)}"` : "";
				return `<a href="${escapeHtml(url(n.href, "href"))}"${title}>${inlines(n.children)}</a>`;
			}
			case "image": {
				const title = n.title ? ` title="${escapeHtml(n.title)}"` : "";
				return `<img src="${escapeHtml(url(n.src, "src"))}" alt="${escapeHtml(n.alt)}"${title} />`;
			}
			case "directive":
				return directive(n.name, n.attributes, "", inlines(n.children), true);
		}
	}

	const blocks = (nodes: Block[], tight = false): string =>
		nodes
			.map((b, i) => {
				const out = block(b, tight);
				return tight && b.type === "paragraph" && i < nodes.length - 1
					? `${out}\n`
					: out;
			})
			.join("");
	function block(b: Block, tight: boolean): string {
		switch (b.type) {
			case "paragraph":
				return tight ? inlines(b.children) : `<p>${inlines(b.children)}</p>\n`;
			case "heading":
				return `<h${b.depth}>${inlines(b.children)}</h${b.depth}>\n`;
			case "thematicBreak":
				return "<hr />\n";
			case "blockquote":
				return `<blockquote>\n${blocks(b.children)}</blockquote>\n`;
			case "code": {
				const lang = b.lang ? ` class="language-${escapeHtml(b.lang)}"` : "";
				const highlighted = options.highlight?.(b.value, b.lang, b.meta);
				return (
					highlighted ??
					`<pre><code${lang}>${escapeHtml(b.value)}</code></pre>\n`
				);
			}
			case "html":
				return options.html
					? `${b.value}\n`
					: `<p>${escapeHtml(b.value)}</p>\n`;
			case "list": {
				const tag = b.ordered ? "ol" : "ul";
				const start = b.ordered && b.start !== 1 ? ` start="${b.start}"` : "";
				const items = b.children
					.map((item) => {
						const box =
							item.checked === null
								? ""
								: `<input type="checkbox" disabled=""${item.checked ? ' checked=""' : ""} /> `;
						const body = blocks(item.children, b.tight);
						const first = item.children[0];
						// A tight item's text sits right after <li>; block children start on a new line.
						const lead =
							body && !(b.tight && first?.type === "paragraph") ? "\n" : "";
						return `<li>${box}${lead}${body}</li>\n`;
					})
					.join("");
				return `<${tag}${start}>\n${items}</${tag}>\n`;
			}
			case "table": {
				const align = (i: number) =>
					b.align[i] ? ` align="${b.align[i]}"` : "";
				const head = b.head
					.map((c, i) => `<th${align(i)}>${inlines(c)}</th>\n`)
					.join("");
				const rows = b.rows
					.map(
						(r) =>
							`<tr>\n${r.map((c, i) => `<td${align(i)}>${inlines(c)}</td>\n`).join("")}</tr>\n`,
					)
					.join("");
				return `<table>\n<thead>\n<tr>\n${head}</tr>\n</thead>\n${rows ? `<tbody>\n${rows}</tbody>\n` : ""}</table>\n`;
			}
			case "directive":
				return `${directive(b.name, b.attributes, inlines(b.label), blocks(b.children), false)}\n`;
		}
	}

	return blocks(nodes);
}
