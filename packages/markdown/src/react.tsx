import {
	type ComponentType,
	createElement,
	Fragment,
	memo,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import type { Attributes, Block, Inline } from "./ast";
import { type ParseOptions, parse } from "./block";
import { defaultUrlTransform } from "./html";
import {
	type AnimateOptions,
	createMotion,
	type Motion,
	motionStyle,
} from "./motion";
import {
	createMarkdownStream,
	type MarkdownStream,
	type StreamBlock,
	type StreamOptions,
} from "./stream";
import { injectStyles } from "./styles";

type Tag =
	| "p"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "a"
	| "img"
	| "code"
	| "pre"
	| "blockquote"
	| "ul"
	| "ol"
	| "li"
	| "hr"
	| "br"
	| "em"
	| "strong"
	| "del"
	| "table"
	| "thead"
	| "tbody"
	| "tr"
	| "th"
	| "td"
	| "input";

/** Props a directive component receives. */
export interface DirectiveProps {
	name: string;
	attributes: Attributes;
	inline: boolean;
	label?: ReactNode;
	children?: ReactNode;
}

export interface RenderOptions extends ParseOptions {
	/** Replace any HTML tag, e.g. `{ a: Link, pre: CodeBlock }`. */
	// biome-ignore lint/suspicious/noExplicitAny: each override takes its own tag's props.
	components?: Partial<Record<Tag, ComponentType<any>>>;
	/** Components for docvia directives by name, e.g. `{ callout: Callout }`. */
	directiveComponents?: Record<string, ComponentType<DirectiveProps>>;
	urlTransform?: (url: string, kind: "href" | "src") => string;
	/** Wrap words in spans that fade in when they first appear. Default false; streaming defaults to true. */
	animate?: boolean;
}

interface Ctx extends RenderOptions {
	key: string;
}

function h(
	ctx: RenderOptions,
	tag: Tag,
	props: Record<string, unknown>,
	...children: ReactNode[]
): ReactNode {
	return createElement(ctx.components?.[tag] ?? tag, props, ...children);
}

function words(text: string, animate: boolean | undefined): ReactNode {
	if (!animate) return text;
	// Keyed by position: React keeps the spans it has, so only new words mount and animate.
	return text
		.split(/(\s+)/)
		.map((part, i) =>
			/^\s*$/.test(part)
				? part
				: createElement("span", { key: i, "data-md-word": "" }, part),
		);
}

function inlines(nodes: Inline[], ctx: RenderOptions): ReactNode[] {
	const url = ctx.urlTransform ?? defaultUrlTransform;
	return nodes.map((n, i) => {
		const key = i;
		switch (n.type) {
			case "text":
				return createElement(Fragment, { key }, words(n.value, ctx.animate));
			case "emphasis":
				return h(ctx, "em", { key }, ...inlines(n.children, ctx));
			case "strong":
				return h(ctx, "strong", { key }, ...inlines(n.children, ctx));
			case "delete":
				return h(ctx, "del", { key }, ...inlines(n.children, ctx));
			case "code":
				return h(ctx, "code", { key }, n.value);
			case "break":
				return h(ctx, "br", { key });
			case "html":
				return createElement("span", {
					key,
					dangerouslySetInnerHTML: { __html: n.value },
				});
			case "link":
				return h(
					ctx,
					"a",
					{ key, href: url(n.href, "href"), title: n.title || undefined },
					...inlines(n.children, ctx),
				);
			case "image":
				return h(ctx, "img", {
					key,
					src: url(n.src, "src"),
					alt: n.alt,
					title: n.title || undefined,
				});
			case "directive": {
				const Custom = ctx.directiveComponents?.[n.name];
				const children = inlines(n.children, ctx);
				return Custom
					? createElement(
							Custom,
							{ key, name: n.name, attributes: n.attributes, inline: true },
							...children,
						)
					: createElement(
							"span",
							{ key, "data-directive": n.name, ...n.attributes },
							...children,
						);
			}
		}
		return null;
	});
}

function block(
	b: Block,
	ctx: RenderOptions,
	key: string | number,
	tight = false,
): ReactNode {
	switch (b.type) {
		case "paragraph":
			return tight
				? createElement(Fragment, { key }, ...inlines(b.children, ctx))
				: h(ctx, "p", { key }, ...inlines(b.children, ctx));
		case "heading":
			return h(
				ctx,
				`h${b.depth}` as Tag,
				{ key, id: b.id },
				...inlines(b.children, ctx),
			);
		case "thematicBreak":
			return h(ctx, "hr", { key });
		case "blockquote":
			return h(
				ctx,
				"blockquote",
				{ key },
				...b.children.map((c, i) => block(c, ctx, i)),
			);
		case "code":
			return h(
				ctx,
				"pre",
				{
					key,
					"data-lang": b.lang || undefined,
					"data-meta": b.meta || undefined,
				},
				h(
					ctx,
					"code",
					{ className: b.lang ? `language-${b.lang}` : undefined },
					b.value,
				),
			);
		case "html":
			return ctx.html
				? createElement("div", {
						key,
						dangerouslySetInnerHTML: { __html: b.value },
					})
				: h(ctx, "p", { key }, b.value);
		case "list":
			return h(
				ctx,
				b.ordered ? "ol" : "ul",
				{ key, start: b.ordered && b.start !== 1 ? b.start : undefined },
				...b.children.map((item, i) =>
					h(
						ctx,
						"li",
						{ key: i },
						item.checked === null
							? null
							: h(ctx, "input", {
									type: "checkbox",
									disabled: true,
									checked: item.checked,
								}),
						item.checked === null ? null : " ",
						...item.children.map((c, j) => block(c, ctx, j, b.tight)),
					),
				),
			);
		case "table": {
			const cell = (tag: "th" | "td", c: Inline[], i: number) =>
				h(
					ctx,
					tag,
					{ key: i, align: b.align[i] ?? undefined },
					...inlines(c, ctx),
				);
			return h(
				ctx,
				"table",
				{ key },
				h(
					ctx,
					"thead",
					{},
					h(ctx, "tr", {}, ...b.head.map((c, i) => cell("th", c, i))),
				),
				b.rows.length
					? h(
							ctx,
							"tbody",
							{},
							...b.rows.map((r, i) =>
								h(ctx, "tr", { key: i }, ...r.map((c, j) => cell("td", c, j))),
							),
						)
					: null,
			);
		}
		case "directive": {
			const Custom = ctx.directiveComponents?.[b.name];
			const children = b.children.map((c, i) => block(c, ctx, i));
			return Custom
				? createElement(
						Custom,
						{
							key,
							name: b.name,
							attributes: b.attributes,
							inline: false,
							label: b.label.length ? inlines(b.label, ctx) : undefined,
						},
						...children,
					)
				: createElement(
						"div",
						{ key, "data-directive": b.name, ...b.attributes },
						...children,
					);
		}
	}
}

/** Renders a Markdown string as React elements; no `dangerouslySetInnerHTML` unless `html` is on. */
export function Markdown({
	children,
	...options
}: RenderOptions & { children: string }): ReactNode {
	// biome-ignore lint/correctness/useExhaustiveDependencies: options is a fresh object each render; only parse inputs matter.
	const root = useMemo(
		() => parse(children, options),
		[children, options.html, options.gfm, options.directives],
	);
	return createElement(
		Fragment,
		null,
		...root.children.map((b, i) => block(b, options, i)),
	);
}

// Finished blocks keep their node object, so memo skips them; only the live tail re-renders.
const StreamBlockView = memo(
	({ node, ctx }: { node: Block; ctx: Ctx }) =>
		createElement(Fragment, null, block(node, ctx, ctx.key)),
	(a, b) => a.node === b.node,
);

/** Feeds a growing string into a stream: appended text is pushed, anything else starts over. */
export function useMarkdownStream(
	markdown: string,
	streaming = true,
	options: StreamOptions = {},
): StreamBlock[] {
	const ref = useRef<{ stream: MarkdownStream; fed: string } | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: options are read only when a stream starts.
	return useMemo(() => {
		let state = ref.current;
		if (!state || !markdown.startsWith(state.fed)) {
			state = { stream: createMarkdownStream(options), fed: "" };
			ref.current = state;
		}
		const blocks =
			markdown.length > state.fed.length
				? state.stream.push(markdown.slice(state.fed.length))
				: state.stream.blocks;
		state.fed = markdown;
		return streaming ? blocks : state.stream.end();
	}, [markdown, streaming]);
}

export interface StreamingMarkdownProps
	extends Omit<RenderOptions, "animate">,
		StreamOptions {
	/** The whole text so far. */
	children: string;
	/** False once the stream has finished. Default true. */
	streaming?: boolean;
	/** Word entry and layout motion; `false` turns it off. Default true (fade). */
	animate?: boolean | AnimateOptions;
	/** A blinking caret after the last word while streaming. Default true. */
	caret?: boolean;
}

/** Renders Markdown as it streams in, e.g. an AI answer; pass the whole text so far on every render. */
export function StreamingMarkdown({
	children,
	streaming = true,
	animate = true,
	caret = true,
	...options
}: StreamingMarkdownProps): ReactNode {
	const motionOptions =
		animate === false ? null : animate === true ? {} : animate;
	const root = useRef<HTMLDivElement>(null);
	const motion = useRef<Motion | null>(null);
	const shown = useRef("");
	// A replaced text restarts the stream, so remembered word positions no longer apply.
	if (!children.startsWith(shown.current)) motion.current?.reset();
	shown.current = children;
	useEffect(() => {
		if (motionOptions || caret) injectStyles(document);
	}, [motionOptions, caret]);
	const blocks = useMarkdownStream(children, streaming, options);
	useLayoutEffect(() => {
		if (!root.current) return;
		motion.current ??= createMotion(root.current);
		motion.current.update(!streaming, motionOptions, caret);
	});
	return createElement(
		"div",
		{
			ref: root,
			"data-md-stream": "",
			style: {
				display: "contents",
				...(motionOptions && motionStyle(motionOptions)),
			},
		},
		...blocks.map((b) =>
			createElement(StreamBlockView, {
				key: b.key,
				node: b.node,
				ctx: { ...options, animate: !!motionOptions, key: b.key },
			}),
		),
	);
}
