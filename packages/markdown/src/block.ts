// biome-ignore-all lint/suspicious/noControlCharactersInRegex: CommonMark defines several rules in terms of control characters.
// Block structure is a port of commonmark.js's block parser (BSD-2-Clause); see THIRD_PARTY_NOTICES.md.
// Additions: GFM tables, task list items, and docvia's `:::name` / `::name` directives.
import type { Block, Inline, ListItem, Root } from "./ast";
import {
	CLOSE_TAG,
	type InlineOptions,
	LINK_LABEL,
	type LinkReference,
	OPEN_TAG,
	parseInline,
	parseLinkDestination,
	parseLinkTitle,
	plainText,
	skipSpace,
} from "./inline";
import {
	normalizeLabel,
	parseAttributes,
	slugify,
	unescapeString,
} from "./util";

export interface ParseOptions {
	/** Keep raw HTML as HTML. Off by default: tags are escaped and shown as text. */
	html?: boolean;
	/** GitHub extensions: tables, task lists, strikethrough, bare URLs. Default true. */
	gfm?: boolean;
	/** docvia directives: `:::name{attrs}`, `::name{attrs}`, `:name[label]`. Default true. */
	directives?: boolean;
	/** Shares link definitions and heading ids across parses, e.g. the segments of a stream. */
	context?: ParseContext;
}

export interface ParseContext {
	refs: Map<string, LinkReference>;
	ids: Map<string, number>;
}

export const createParseContext = (): ParseContext => ({
	refs: new Map(),
	ids: new Map(),
});

type Kind =
	| "document"
	| "blockquote"
	| "list"
	| "item"
	| "heading"
	| "thematic"
	| "code"
	| "html"
	| "paragraph"
	| "table"
	| "directive";

interface ListData {
	ordered: boolean;
	bullet: string;
	delimiter: string;
	start: number;
	tight: boolean;
	markerOffset: number;
	padding: number;
}

interface Node {
	kind: Kind;
	parent: Node | null;
	children: Node[];
	open: boolean;
	content: string;
	startLine: number;
	endLine: number;
	level?: number;
	fenced?: boolean;
	fenceChar?: string;
	fenceLength?: number;
	fenceOffset?: number;
	info?: string;
	htmlType?: number;
	list?: ListData;
	align?: Array<"left" | "right" | "center" | null>;
	rows?: string[];
	name?: string;
	label?: string;
	attrs?: string;
	colons?: number;
}

const CODE_INDENT = 4;
const HTML_OPEN = [
	/./,
	/^<(?:script|pre|textarea|style)(?:\s|>|$)/i,
	/^<!--/,
	/^<[?]/,
	/^<![A-Za-z]/,
	/^<!\[CDATA\[/,
	/^<[/]?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[123456]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|search|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|[/]?[>]|$)/i,
	new RegExp(`^(?:${OPEN_TAG}|${CLOSE_TAG})\\s*$`, "i"),
];
const HTML_CLOSE = [
	/./,
	/<\/(?:script|pre|textarea|style)>/i,
	/-->/,
	/\?>/,
	/>/,
	/\]\]>/,
];
const THEMATIC = /^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$|^(?:-[ \t]*){3,}$/;
const MAYBE_SPECIAL = /^[#`~*+_=<>0-9:|-]/;
const NON_SPACE = /[^ \t\f\v\r\n]/;
const ATX = /^#{1,6}(?:[ \t]+|$)/;
const FENCE = /^`{3,}(?!.*`)|^~{3,}/;
const CLOSING_FENCE = /^(?:`{3,}|~{3,})(?=[ \t]*$)/;
const SETEXT = /^(?:=+|-+)[ \t]*$/;
const DIRECTIVE_OPEN =
	/^(:{2,})[ \t]*([a-zA-Z][\w-]*)(?:\[([^\]\n]*)\])?(?:\{([^}\n]*)\})?[ \t]*$/;
const TABLE_DELIM = /^\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

const blank = (s: string) => !NON_SPACE.test(s);
const spaceOrTab = (c: string | undefined) => c === " " || c === "\t";

/** Splits a GFM table row into raw cell strings, honouring `\|`. */
export function splitRow(line: string): string[] {
	let row = line.trim();
	if (row.startsWith("|")) row = row.slice(1);
	if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
	const cells: string[] = [];
	let cell = "";
	for (let i = 0; i < row.length; i++) {
		const ch = row[i];
		if (ch === "\\" && row[i + 1] === "|") {
			cell += "|";
			i++;
		} else if (ch === "|") {
			cells.push(cell.trim());
			cell = "";
		} else cell += ch;
	}
	cells.push(cell.trim());
	return cells;
}

/** Parses Markdown into a block tree with parsed inlines. */
export function parse(markdown: string, options: ParseOptions = {}): Root {
	const opts: InlineOptions = {
		refs: options.context?.refs ?? new Map<string, LinkReference>(),
		html: options.html ?? false,
		gfm: options.gfm ?? true,
		directives: options.directives ?? true,
	};
	const doc: Node = make("document", null, 1);
	let tip = doc;
	let oldTip = doc;
	let lastMatched = doc;
	let allClosed = true;
	let line = "";
	let lineNumber = 0;
	let offset = 0;
	let column = 0;
	let nextNonspace = 0;
	let nextNonspaceColumn = 0;
	let indent = 0;
	let indented = false;
	let isBlank = false;
	let partialTab = false;
	let tableStarted = false;

	function make(kind: Kind, parent: Node | null, startLine: number): Node {
		return {
			kind,
			parent,
			children: [],
			open: true,
			content: "",
			startLine,
			endLine: startLine,
		};
	}

	const canContain = (parent: Kind, child: Kind) =>
		parent === "document" ||
		parent === "blockquote" ||
		parent === "item" ||
		parent === "directive"
			? child !== "item"
			: parent === "list"
				? child === "item"
				: false;
	const acceptsLines = (k: Kind) =>
		k === "paragraph" || k === "code" || k === "html" || k === "table";

	function findNextNonspace() {
		let i = offset;
		let cols = column;
		let c = "";
		while (i < line.length) {
			c = line[i] as string;
			if (c === " ") {
				i++;
				cols++;
			} else if (c === "\t") {
				i++;
				cols += 4 - (cols % 4);
			} else break;
		}
		isBlank = i >= line.length;
		nextNonspace = i;
		nextNonspaceColumn = cols;
		indent = nextNonspaceColumn - column;
		indented = indent >= CODE_INDENT;
	}

	function advanceOffset(count: number, columns: boolean) {
		let n = count;
		while (n > 0 && offset < line.length) {
			if (line[offset] === "\t") {
				const toTab = 4 - (column % 4);
				if (columns) {
					partialTab = toTab > n;
					const step = toTab > n ? n : toTab;
					column += step;
					offset += partialTab ? 0 : 1;
					n -= step;
				} else {
					partialTab = false;
					column += toTab;
					offset++;
					n--;
				}
			} else {
				partialTab = false;
				offset++;
				column++;
				n--;
			}
		}
	}

	function advanceNextNonspace() {
		offset = nextNonspace;
		column = nextNonspaceColumn;
		partialTab = false;
	}

	function addLine() {
		if (partialTab) {
			offset++;
			tip.content += " ".repeat(4 - (column % 4));
		}
		tip.content += `${line.slice(offset)}\n`;
	}

	function addChild(kind: Kind): Node {
		while (!canContain(tip.kind, kind)) finalize(tip, lineNumber - 1);
		const node = make(kind, tip, lineNumber);
		tip.children.push(node);
		tip = node;
		return node;
	}

	function closeUnmatched() {
		if (allClosed) return;
		while (oldTip !== lastMatched) {
			const parent = oldTip.parent as Node;
			finalize(oldTip, lineNumber - 1);
			oldTip = parent;
		}
		allClosed = true;
	}

	/** Link reference definitions at the start of a paragraph; returns the characters consumed. */
	function parseReference(s: string): number {
		const label = LINK_LABEL.exec(s);
		if (!label || s[(label[0] as string).length] !== ":") return 0;
		let pos = skipSpace(s, (label[0] as string).length + 1);
		const dest = parseLinkDestination(s, pos);
		if (!dest || (dest.value === "" && s[pos] !== "<")) return 0;
		pos = dest.end;
		const beforeTitle = pos;
		pos = skipSpace(s, pos);
		let title = pos !== beforeTitle ? parseLinkTitle(s, pos) : null;
		if (title) pos = title.end;
		const atEnd = (p: number) => /^[ \t]*(?:\n|$)/.exec(s.slice(p));
		let end = atEnd(title ? pos : beforeTitle);
		if (title && !end) {
			title = null;
			end = atEnd(beforeTitle);
			pos = beforeTitle;
		}
		if (!end) return 0;
		const key = normalizeLabel(label[1] as string);
		if (!key) return 0;
		if (!opts.refs.has(key))
			opts.refs.set(key, { href: dest.value, title: title?.value ?? "" });
		return (title ? pos : beforeTitle) + (end[0] as string).length;
	}

	function stripReferences(node: Node) {
		while (node.content[0] === "[") {
			const pos = parseReference(node.content);
			if (!pos) break;
			node.content = node.content.slice(pos);
		}
	}

	function endsWithBlankLine(node: Node, next: Node | undefined) {
		return next !== undefined && node.endLine !== next.startLine - 1;
	}

	function finalize(node: Node, endLine: number) {
		const above = node.parent;
		node.open = false;
		node.endLine = endLine;
		// Lists and items end where their content ends, so trailing blank lines can mark them loose.
		if (node.kind === "item" || node.kind === "list")
			node.endLine = node.children.at(-1)?.endLine ?? node.startLine;
		if (node.kind === "paragraph") stripReferences(node);
		else if (node.kind === "code") {
			if (node.fenced) {
				const nl = node.content.indexOf("\n");
				node.info = unescapeString(node.content.slice(0, nl).trim());
				node.content = node.content.slice(nl + 1);
			} else {
				const lines = node.content.split("\n");
				while (lines.length > 0 && /^[ \t]*$/.test(lines.at(-1) as string))
					lines.pop();
				node.content = `${lines.join("\n")}\n`;
			}
		} else if (node.kind === "html")
			node.content = node.content.replace(/\n$/, "");
		else if (node.kind === "list" && node.list) {
			const items = node.children;
			outer: for (let i = 0; i < items.length; i++) {
				const item = items[i] as Node;
				if (i < items.length - 1 && endsWithBlankLine(item, items[i + 1])) {
					node.list.tight = false;
					break;
				}
				for (let j = 0; j < item.children.length - 1; j++) {
					if (
						endsWithBlankLine(item.children[j] as Node, item.children[j + 1])
					) {
						node.list.tight = false;
						break outer;
					}
				}
			}
		}
		tip = above as Node;
	}

	function parseListMarker(container: Node): ListData | null {
		if (indent >= 4) return null;
		const rest = line.slice(nextNonspace);
		const data: ListData = {
			ordered: false,
			bullet: "",
			delimiter: "",
			start: 1,
			tight: true,
			markerOffset: indent,
			padding: 0,
		};
		const bullet = /^[*+-]/.exec(rest);
		const ordered = bullet ? null : /^(\d{1,9})([.)])/.exec(rest);
		if (bullet) data.bullet = bullet[0] as string;
		else if (
			ordered &&
			(container.kind !== "paragraph" || ordered[1] === "1")
		) {
			data.ordered = true;
			data.start = Number.parseInt(ordered[1] as string, 10);
			data.delimiter = ordered[2] as string;
		} else return null;
		const markerLength = ((bullet ?? ordered) as RegExpExecArray)[0].length;
		const after = line[nextNonspace + markerLength];
		if (!(after === undefined || after === "\t" || after === " ")) return null;
		if (
			container.kind === "paragraph" &&
			blank(line.slice(nextNonspace + markerLength))
		)
			return null;
		advanceNextNonspace();
		advanceOffset(markerLength, true);
		const spacesStartCol = column;
		const spacesStartOffset = offset;
		do advanceOffset(1, true);
		while (column - spacesStartCol < 5 && spaceOrTab(line[offset]));
		const blankItem = offset >= line.length;
		const spacesAfter = column - spacesStartCol;
		if (spacesAfter >= 5 || spacesAfter < 1 || blankItem) {
			data.padding = markerLength + 1;
			column = spacesStartCol;
			offset = spacesStartOffset;
			if (spaceOrTab(line[offset])) advanceOffset(1, true);
		} else data.padding = markerLength + spacesAfter;
		return data;
	}

	/** 0: matched, 1: not matched, 2: line fully handled. */
	function continues(node: Node): 0 | 1 | 2 {
		switch (node.kind) {
			case "document":
			case "list":
				return 0;
			case "blockquote":
				if (!indented && line[nextNonspace] === ">") {
					advanceNextNonspace();
					advanceOffset(1, false);
					if (spaceOrTab(line[offset])) advanceOffset(1, true);
					return 0;
				}
				return 1;
			case "item": {
				const list = node.list as ListData;
				if (isBlank) {
					if (node.children.length === 0) return 1;
					advanceNextNonspace();
				} else if (indent >= list.markerOffset + list.padding)
					advanceOffset(list.markerOffset + list.padding, true);
				else return 1;
				return 0;
			}
			case "code":
				if (node.fenced) {
					const m =
						indent <= 3 && line[nextNonspace] === node.fenceChar
							? CLOSING_FENCE.exec(line.slice(nextNonspace))
							: null;
					if (m && (m[0] as string).length >= (node.fenceLength as number)) {
						finalize(node, lineNumber);
						return 2;
					}
					let i = node.fenceOffset as number;
					while (i > 0 && spaceOrTab(line[offset])) {
						advanceOffset(1, true);
						i--;
					}
					return 0;
				}
				if (indent >= CODE_INDENT) advanceOffset(CODE_INDENT, true);
				else if (isBlank) advanceNextNonspace();
				else return 1;
				return 0;
			case "html":
				return isBlank && (node.htmlType === 6 || node.htmlType === 7) ? 1 : 0;
			case "paragraph":
				return isBlank ? 1 : 0;
			case "table":
				// A table ends at a blank line or at the start of another block.
				return isBlank ||
					/^(?:#{1,6}(?:[ \t]|$)|>|`{3}|~{3})/.test(line.slice(nextNonspace))
					? 1
					: 0;
			case "directive": {
				if (!indented) {
					const m = /^(:{2,})[ \t]*$/.exec(line.slice(nextNonspace));
					if (m && (m[1] as string).length >= (node.colons as number)) {
						finalize(node, lineNumber);
						return 2;
					}
				}
				return 0;
			}
			default:
				return 1;
		}
	}

	/** 0: no match, 1: container started, 2: leaf started. */
	const starts: Array<(container: Node) => 0 | 1 | 2> = [
		() => {
			if (indented || line[nextNonspace] !== ">") return 0;
			advanceNextNonspace();
			advanceOffset(1, false);
			if (spaceOrTab(line[offset])) advanceOffset(1, true);
			closeUnmatched();
			addChild("blockquote");
			return 1;
		},
		() => {
			const m = indented ? null : ATX.exec(line.slice(nextNonspace));
			if (!m) return 0;
			advanceNextNonspace();
			advanceOffset((m[0] as string).length, false);
			closeUnmatched();
			const node = addChild("heading");
			node.level = (m[0] as string).trim().length;
			node.content = line
				.slice(offset)
				.replace(/^[ \t]*#+[ \t]*$/, "")
				.replace(/[ \t]+#+[ \t]*$/, "");
			advanceOffset(line.length - offset, false);
			return 2;
		},
		() => {
			const m = indented ? null : FENCE.exec(line.slice(nextNonspace));
			if (!m) return 0;
			closeUnmatched();
			const node = addChild("code");
			node.fenced = true;
			node.fenceLength = (m[0] as string).length;
			node.fenceChar = (m[0] as string)[0];
			node.fenceOffset = indent;
			advanceNextNonspace();
			advanceOffset((m[0] as string).length, false);
			return 2;
		},
		(container) => {
			if (indented || line[nextNonspace] !== "<") return 0;
			const s = line.slice(nextNonspace);
			for (let type = 1; type <= 7; type++) {
				if (
					(HTML_OPEN[type] as RegExp).test(s) &&
					(type < 7 ||
						(container.kind !== "paragraph" &&
							(allClosed || isBlank || tip.kind !== "paragraph")))
				) {
					closeUnmatched();
					const node = addChild("html");
					node.htmlType = type;
					return 2;
				}
			}
			return 0;
		},
		(container) => {
			if (
				indented ||
				container.kind !== "paragraph" ||
				!SETEXT.test(line.slice(nextNonspace))
			)
				return 0;
			closeUnmatched();
			stripReferences(container);
			if (!container.content) return 0;
			container.kind = "heading";
			container.level = line[nextNonspace] === "=" ? 1 : 2;
			advanceOffset(line.length - offset, false);
			return 2;
		},
		(container) => {
			// GFM table: the paragraph's last line is the header; this line is the delimiter row.
			if (
				!opts.gfm ||
				indented ||
				container.kind !== "paragraph" ||
				!TABLE_DELIM.test(line.slice(nextNonspace))
			)
				return 0;
			const lines = container.content.replace(/\n$/, "").split("\n");
			const header = lines.at(-1) as string;
			const delim = splitRow(line.slice(nextNonspace));
			if (!header.includes("|") && !line.includes("|")) return 0;
			if (splitRow(header).length !== delim.length) return 0;
			closeUnmatched();
			container.content =
				lines.length > 1 ? `${lines.slice(0, -1).join("\n")}\n` : "";
			const parent = container.parent as Node;
			if (!container.content) parent.children.pop();
			else finalize(container, lineNumber - 1);
			tip = parent;
			const table = addChild("table");
			table.align = delim.map((c) =>
				c.startsWith(":") && c.endsWith(":")
					? "center"
					: c.endsWith(":")
						? "right"
						: c.startsWith(":")
							? "left"
							: null,
			);
			table.rows = [header];
			tableStarted = true;
			advanceOffset(line.length - offset, false);
			return 2;
		},
		() => {
			if (indented || !THEMATIC.test(line.slice(nextNonspace))) return 0;
			closeUnmatched();
			addChild("thematic");
			advanceOffset(line.length - offset, false);
			return 2;
		},
		(container) => {
			if (indented && container.kind !== "list") return 0;
			const data = parseListMarker(container);
			if (!data) return 0;
			closeUnmatched();
			const list = tip.kind === "list" ? tip.list : undefined;
			if (
				tip.kind !== "list" ||
				!list ||
				list.ordered !== data.ordered ||
				list.delimiter !== data.delimiter ||
				list.bullet !== data.bullet
			) {
				addChild("list").list = data;
			}
			addChild("item").list = data;
			return 1;
		},
		() => {
			if (!opts.directives || indented) return 0;
			const m = DIRECTIVE_OPEN.exec(line.slice(nextNonspace));
			if (!m) return 0;
			closeUnmatched();
			const node = addChild("directive");
			node.colons = (m[1] as string).length;
			node.name = m[2];
			node.label = m[3] ?? "";
			node.attrs = m[4] ?? "";
			advanceOffset(line.length - offset, false);
			// `::name` is a leaf; `:::name` holds blocks until a closing `:::`.
			if (node.colons === 2) {
				finalize(node, lineNumber);
				return 2;
			}
			return 1;
		},
		() => {
			if (!indented || tip.kind === "paragraph" || isBlank) return 0;
			advanceOffset(CODE_INDENT, true);
			closeUnmatched();
			addChild("code");
			return 2;
		},
	];

	function incorporate(raw: string) {
		let container = doc;
		oldTip = tip;
		offset = 0;
		column = 0;
		isBlank = false;
		partialTab = false;
		lineNumber++;
		tableStarted = false;
		line = raw.includes("\0") ? raw.replace(/\0/g, "�") : raw;

		for (
			let last = container.children.at(-1);
			last?.open;
			last = container.children.at(-1)
		) {
			container = last;
			findNextNonspace();
			const r = continues(container);
			if (r === 2) return;
			if (r === 1) {
				container = container.parent as Node;
				break;
			}
		}
		allClosed = container === oldTip;
		lastMatched = container;

		let matchedLeaf =
			container.kind !== "paragraph" && acceptsLines(container.kind);
		while (!matchedLeaf) {
			findNextNonspace();
			if (!indented && !MAYBE_SPECIAL.test(line.slice(nextNonspace))) {
				advanceNextNonspace();
				break;
			}
			let i = 0;
			for (; i < starts.length; i++) {
				const r = (starts[i] as (c: Node) => 0 | 1 | 2)(container);
				if (r === 1) {
					container = tip;
					break;
				}
				if (r === 2) {
					container = tip;
					matchedLeaf = true;
					break;
				}
			}
			if (i === starts.length) {
				advanceNextNonspace();
				break;
			}
		}

		if (!allClosed && !isBlank && tip.kind === "paragraph") {
			addLine();
			return;
		}
		closeUnmatched();
		if (container.kind === "table") {
			if (!tableStarted) container.rows?.push(line.slice(offset));
		} else if (acceptsLines(container.kind)) {
			addLine();
			const type = container.htmlType ?? 0;
			if (
				container.kind === "html" &&
				type >= 1 &&
				type <= 5 &&
				(HTML_CLOSE[type] as RegExp).test(line.slice(offset))
			)
				finalize(container, lineNumber);
		} else if (offset < line.length && !isBlank) {
			addChild("paragraph");
			advanceNextNonspace();
			addLine();
		}
	}

	const lines = markdown.split(/\r\n|\n|\r/);
	const count = markdown.endsWith("\n") ? lines.length - 1 : lines.length;
	for (let i = 0; i < count; i++) incorporate(lines[i] as string);
	while (tip !== doc) finalize(tip, count);
	finalize(doc, count);

	const ids = options.context?.ids ?? new Map<string, number>();
	const inline = (s: string): Inline[] =>
		parseInline(s.replace(/\n$/, ""), opts);
	const toBlocks = (nodes: Node[]): Block[] => nodes.flatMap(toBlock);
	function toBlock(n: Node): Block[] {
		switch (n.kind) {
			case "paragraph": {
				if (!n.content.trim()) return [];
				return [{ type: "paragraph", children: inline(n.content.trim()) }];
			}
			case "heading": {
				const children = inline(n.content.trim());
				const base = slugify(plainText(children)) || "section";
				const seen = ids.get(base) ?? 0;
				ids.set(base, seen + 1);
				return [
					{
						type: "heading",
						depth: n.level as 1,
						id: seen ? `${base}-${seen}` : base,
						children,
					},
				];
			}
			case "code": {
				const [lang = "", ...meta] = (n.info ?? "").split(/\s+/);
				return [{ type: "code", lang, meta: meta.join(" "), value: n.content }];
			}
			case "html":
				return [{ type: "html", value: n.content }];
			case "thematic":
				return [{ type: "thematicBreak" }];
			case "blockquote":
				return [{ type: "blockquote", children: toBlocks(n.children) }];
			case "table": {
				const rows = (n.rows ?? []).map((r) => splitRow(r));
				const width = n.align?.length ?? 0;
				const cells = (row: string[]) =>
					Array.from({ length: width }, (_, i) => inline(row[i] ?? ""));
				return [
					{
						type: "table",
						align: n.align ?? [],
						head: cells(rows[0] ?? []),
						rows: rows.slice(1).map(cells),
					},
				];
			}
			case "directive":
				return [
					{
						type: "directive",
						name: n.name as string,
						label: n.label ? inline(n.label) : [],
						attributes: parseAttributes(n.attrs ?? ""),
						children: toBlocks(n.children),
					},
				];
			case "list": {
				const list = n.list as ListData;
				const items: ListItem[] = n.children.map((item) => {
					let checked: boolean | null = null;
					const first = item.children[0];
					if (opts.gfm && first?.kind === "paragraph") {
						const m = /^\[([ xX])\][ \t]+/.exec(first.content);
						if (m) {
							checked = m[1] !== " ";
							first.content = first.content.slice((m[0] as string).length);
						}
					}
					return {
						type: "listItem",
						checked,
						children: toBlocks(item.children),
					};
				});
				return [
					{
						type: "list",
						ordered: list.ordered,
						start: list.start,
						tight: list.tight,
						children: items,
					},
				];
			}
			default:
				return [];
		}
	}
	return { type: "root", children: toBlocks(doc.children) };
}
