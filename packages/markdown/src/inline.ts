// biome-ignore-all lint/suspicious/noControlCharactersInRegex: CommonMark defines several rules in terms of control characters.
// Delimiter and bracket handling follow commonmark.js (BSD-2-Clause); see THIRD_PARTY_NOTICES.md.
import type { Attributes, Inline } from "./ast";
import {
	decodeEntities,
	ENTITY_RE,
	encodeUrl,
	normalizeLabel,
	parseAttributes,
	unescapeString,
} from "./util";

export interface LinkReference {
	href: string;
	title: string;
}

export interface InlineOptions {
	refs: Map<string, LinkReference>;
	html: boolean;
	gfm: boolean;
	directives: boolean;
}

interface Item {
	node: Inline;
	prev: Item | null;
	next: Item | null;
	delim?: Delim;
	/** Bracket openers stay separate nodes, so text never merges into them. */
	fixed?: boolean;
}

interface Delim {
	char: string;
	count: number;
	origCount: number;
	canOpen: boolean;
	canClose: boolean;
	item: Item;
	prev: Delim | null;
	next: Delim | null;
}

interface Bracket {
	item: Item;
	image: boolean;
	active: boolean;
	/** Source index just after the `[`. */
	start: number;
	prevDelim: Delim | null;
	prev: Bracket | null;
}

const PUNCT = /[\p{P}\p{S}]/u;
const SPACE = /\s/u;
const ESCAPABLE = /[!-/:-@[-`{-~]/;
const AUTOLINK = /^<([A-Za-z][A-Za-z0-9.+-]{1,31}:[^<>\x00-\x20]*)>/;
const EMAIL =
	/^<([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;
const ATTR = `\\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?`;
export const OPEN_TAG = `<[A-Za-z][A-Za-z0-9-]*(?:${ATTR})*\\s*/?>`;
export const CLOSE_TAG = "</[A-Za-z][A-Za-z0-9-]*\\s*>";
const HTML_TAG = new RegExp(
	`^(?:${OPEN_TAG}|${CLOSE_TAG}|<!-->|<!--->|<!--[\\s\\S]*?-->|<\\?[\\s\\S]*?\\?>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`,
);
const WWW = /^(?:https?:\/\/|www\.)[^\s<]*[^\s<?!.,:*_~'"]/;
const TEXT_DIRECTIVE =
	/^:([a-zA-Z][\w-]*)(?:\[([^\]\n]*)\])?(?:\{([^}\n]*)\})?/;
export const LINK_LABEL = /^\[((?:[^\\[\]]|\\.){0,999})\]/s;
const LINK_TITLE =
	/^(?:"((?:\\[\s\S]|[^\\"\x00])*)"|'((?:\\[\s\S]|[^\\'\x00])*)'|\(((?:\\[\s\S]|[^\\()\x00])*)\))/;

/** Spaces and at most one line ending, as between a link destination and its title. */
export function skipSpace(src: string, pos: number): number {
	const m = /^[ \t]*(?:\n[ \t]*)?/.exec(src.slice(pos));
	return pos + (m?.[0].length ?? 0);
}

export function parseLinkDestination(
	src: string,
	pos: number,
): { value: string; end: number } | null {
	const braced = /^<((?:[^<>\n\\\x00]|\\.)*)>/.exec(src.slice(pos));
	if (braced)
		return {
			value: encodeUrl(unescapeString(braced[1] as string)),
			end: pos + (braced[0] as string).length,
		};
	if (src[pos] === "<") return null;
	let p = pos;
	let depth = 0;
	while (p < src.length) {
		const ch = src[p] as string;
		if (ch === "\\" && ESCAPABLE.test(src[p + 1] ?? "")) p += 2;
		else if (ch === "(") {
			depth++;
			p++;
		} else if (ch === ")") {
			if (depth === 0) break;
			depth--;
			p++;
		} else if (/[ \t\n\r\x0b\x0c\x00-\x1f]/.test(ch)) break;
		else p++;
	}
	if ((p === pos && src[p] !== ")") || depth !== 0) return null;
	return { value: encodeUrl(unescapeString(src.slice(pos, p))), end: p };
}

export function parseLinkTitle(
	src: string,
	pos: number,
): { value: string; end: number } | null {
	const m = LINK_TITLE.exec(src.slice(pos));
	if (!m) return null;
	return {
		value: unescapeString(m[1] ?? m[2] ?? m[3] ?? ""),
		end: pos + (m[0] as string).length,
	};
}

/** Parses inline Markdown into nodes, following CommonMark's delimiter algorithm. */
export function parseInline(src: string, opts: InlineOptions): Inline[] {
	let pos = 0;
	let head = null as Item | null;
	let tail = null as Item | null;
	let delims: Delim | null = null;
	let brackets: Bracket | null = null;

	const append = (node: Inline): Item => {
		const item: Item = { node, prev: tail, next: null };
		if (tail) tail.next = item;
		else head = item;
		tail = item;
		return item;
	};
	const text = (value: string) => {
		if (tail?.node.type === "text" && !tail.delim && !tail.fixed)
			tail.node.value += value;
		else append({ type: "text", value });
	};
	const fixedText = (value: string): Item => {
		const item = append({ type: "text", value });
		item.fixed = true;
		return item;
	};
	const unlink = (item: Item) => {
		if (item.prev) item.prev.next = item.next;
		else head = item.next;
		if (item.next) item.next.prev = item.prev;
		else tail = item.prev;
	};
	const removeDelim = (d: Delim) => {
		if (d.prev) d.prev.next = d.next;
		if (d.next) d.next.prev = d.prev;
		else delims = d.prev;
	};

	const processEmphasis = (bottom: Delim | null) => {
		const openersBottom: Record<string, Delim | null> = {};
		let closer: Delim | null = delims;
		while (closer && closer.prev !== bottom) closer = closer.prev;
		while (closer) {
			if (!closer.canClose) {
				closer = closer.next;
				continue;
			}
			const key = `${closer.char}${closer.canOpen ? 1 : 0}${closer.origCount % 3}`;
			let opener = closer.prev;
			let found = false;
			while (opener && opener !== bottom && opener !== openersBottom[key]) {
				const odd =
					(closer.canOpen || opener.canClose) &&
					closer.origCount % 3 !== 0 &&
					(opener.origCount + closer.origCount) % 3 === 0;
				if (
					opener.char === closer.char &&
					opener.canOpen &&
					!odd &&
					(closer.char !== "~" || opener.count === closer.count)
				) {
					found = true;
					break;
				}
				opener = opener.prev;
			}
			if (!found || !opener) {
				openersBottom[key] = closer.prev;
				const next: Delim | null = closer.next;
				if (!closer.canOpen) removeDelim(closer);
				closer = next;
				continue;
			}
			const use =
				closer.char === "~"
					? closer.count
					: closer.count >= 2 && opener.count >= 2
						? 2
						: 1;
			opener.count -= use;
			closer.count -= use;
			(opener.item.node as { value: string }).value = opener.char.repeat(
				opener.count,
			);
			(closer.item.node as { value: string }).value = closer.char.repeat(
				closer.count,
			);
			const children: Inline[] = [];
			for (let it = opener.item.next; it && it !== closer.item; it = it.next)
				children.push(it.node);
			const node: Inline =
				closer.char === "~"
					? { type: "delete", children }
					: use === 2
						? { type: "strong", children }
						: { type: "emphasis", children };
			const wrapped: Item = { node, prev: opener.item, next: closer.item };
			opener.item.next = wrapped;
			closer.item.prev = wrapped;
			let d = closer.prev;
			while (d && d !== opener) {
				const p = d.prev;
				removeDelim(d);
				d = p;
			}
			if (opener.count === 0) {
				unlink(opener.item);
				removeDelim(opener);
			}
			if (closer.count === 0) {
				unlink(closer.item);
				const next: Delim | null = closer.next;
				removeDelim(closer);
				closer = next;
			}
		}
		while (delims && delims !== bottom) removeDelim(delims);
	};

	const scanDelims = (char: string) => {
		let end = pos;
		while (src[end] === char) end++;
		const count = end - pos;
		if (char === "~" && count > 2) {
			text(src.slice(pos, end));
			pos = end;
			return;
		}
		const before = pos === 0 ? "\n" : (src[pos - 1] as string);
		const after = end >= src.length ? "\n" : (src[end] as string);
		const afterSpace = SPACE.test(after);
		const beforeSpace = SPACE.test(before);
		const afterPunct = PUNCT.test(after);
		const beforePunct = PUNCT.test(before);
		const left = !afterSpace && (!afterPunct || beforeSpace || beforePunct);
		const right = !beforeSpace && (!beforePunct || afterSpace || afterPunct);
		const canOpen = char === "_" ? left && (!right || beforePunct) : left;
		const canClose = char === "_" ? right && (!left || afterPunct) : right;
		const item = append({ type: "text", value: src.slice(pos, end) });
		pos = end;
		if (!canOpen && !canClose) return;
		const d: Delim = {
			char,
			count,
			origCount: count,
			canOpen,
			canClose,
			item,
			prev: delims,
			next: null,
		};
		item.delim = d;
		if (delims) delims.next = d;
		delims = d;
	};

	const linkTail = (): LinkReference | null => {
		if (src[pos] !== "(") return null;
		let p = skipSpace(src, pos + 1);
		const dest = parseLinkDestination(src, p);
		if (!dest) return null;
		p = dest.end;
		const beforeTitle = p;
		p = skipSpace(src, p);
		const title = p > beforeTitle ? parseLinkTitle(src, p) : null;
		p = skipSpace(src, title ? title.end : beforeTitle);
		if (src[p] !== ")") return null;
		pos = p + 1;
		return { href: dest.value, title: title?.value ?? "" };
	};

	const closeBracket = () => {
		const opener = brackets;
		pos++;
		if (!opener) {
			text("]");
			return;
		}
		brackets = opener.prev;
		if (!opener.active) {
			text("]");
			return;
		}
		const labelEnd = pos - 1;
		const afterBracket = pos;
		let target = linkTail();
		if (!target) {
			pos = afterBracket;
			let label = src.slice(opener.start, labelEnd);
			const ref = LINK_LABEL.exec(src.slice(pos));
			if (ref && (ref[1] as string).trim()) {
				label = ref[1] as string;
				pos += (ref[0] as string).length;
			} else if (ref) pos += 2;
			const found = opts.refs.get(normalizeLabel(label));
			if (found) target = found;
			else pos = afterBracket;
		}
		if (!target) {
			text("]");
			return;
		}
		processEmphasis(opener.prevDelim);
		const children: Inline[] = [];
		for (let it = opener.item.next; it; it = it.next) children.push(it.node);
		tail = opener.item;
		opener.item.next = null;
		opener.item.node = opener.image
			? {
					type: "image",
					src: target.href,
					alt: plainText(children),
					title: target.title,
				}
			: { type: "link", href: target.href, title: target.title, children };
		if (!opener.image)
			for (let b = brackets; b; b = b.prev) if (!b.image) b.active = false;
	};

	while (pos < src.length) {
		const ch = src[pos] as string;
		if (ch === "\\") {
			const next = src[pos + 1];
			if (next === "\n") {
				append({ type: "break" });
				pos += 2;
			} else if (next && ESCAPABLE.test(next)) {
				text(next);
				pos += 2;
			} else {
				text("\\");
				pos++;
			}
		} else if (ch === "`") {
			let end = pos;
			while (src[end] === "`") end++;
			const len = end - pos;
			let close = -1;
			for (let at = src.indexOf("`", end); at !== -1; ) {
				let runEnd = at;
				while (src[runEnd] === "`") runEnd++;
				if (runEnd - at === len) {
					close = at;
					break;
				}
				at = src.indexOf("`", runEnd);
			}
			if (close === -1) {
				text(src.slice(pos, end));
				pos = end;
			} else {
				let value = src.slice(end, close).replace(/\n/g, " ");
				if (
					value.length > 1 &&
					value[0] === " " &&
					value.at(-1) === " " &&
					value.trim()
				)
					value = value.slice(1, -1);
				append({ type: "code", value });
				pos = close + len;
			}
		} else if (ch === "*" || ch === "_" || (ch === "~" && opts.gfm)) {
			scanDelims(ch);
		} else if (ch === "[") {
			brackets = {
				item: fixedText("["),
				image: false,
				active: true,
				start: pos + 1,
				prevDelim: delims,
				prev: brackets,
			};
			pos++;
		} else if (ch === "!" && src[pos + 1] === "[") {
			brackets = {
				item: fixedText("!["),
				image: true,
				active: true,
				start: pos + 2,
				prevDelim: delims,
				prev: brackets,
			};
			pos += 2;
		} else if (ch === "]") {
			closeBracket();
		} else if (ch === "<") {
			const rest = src.slice(pos);
			const auto = AUTOLINK.exec(rest);
			const email = auto ? null : EMAIL.exec(rest);
			const tag = auto || email ? null : HTML_TAG.exec(rest);
			if (auto) {
				const url = auto[1] as string;
				append({
					type: "link",
					href: encodeUrl(url),
					title: "",
					children: [{ type: "text", value: url }],
				});
				pos += (auto[0] as string).length;
			} else if (email) {
				const address = email[1] as string;
				append({
					type: "link",
					href: encodeUrl(`mailto:${address}`),
					title: "",
					children: [{ type: "text", value: address }],
				});
				pos += (email[0] as string).length;
			} else if (tag) {
				// Without `html`, a tag stays literal text and is escaped on output.
				if (opts.html) append({ type: "html", value: tag[0] as string });
				else text(tag[0] as string);
				pos += (tag[0] as string).length;
			} else {
				text("<");
				pos++;
			}
		} else if (ch === "&") {
			const m = ENTITY_RE.exec(src.slice(pos));
			if (m) {
				text(decodeEntities(m[0] as string));
				pos += (m[0] as string).length;
			} else {
				text("&");
				pos++;
			}
		} else if (ch === "\n") {
			const prev = tail?.node;
			if (prev?.type === "text" && !tail?.delim) {
				const hard = / {2,}$/.test(prev.value);
				prev.value = prev.value.replace(/ +$/, "");
				if (hard) append({ type: "break" });
				else text("\n");
			} else text("\n");
			pos++;
			while (src[pos] === " ") pos++;
		} else if (
			opts.directives &&
			ch === ":" &&
			/[a-zA-Z]/.test(src[pos + 1] ?? "") &&
			(pos === 0 || /[\s([{]/.test(src[pos - 1] as string))
		) {
			const m = TEXT_DIRECTIVE.exec(src.slice(pos));
			if (m && (m[2] !== undefined || m[3] !== undefined)) {
				const attributes: Attributes =
					m[3] !== undefined ? parseAttributes(m[3]) : {};
				append({
					type: "directive",
					name: m[1] as string,
					attributes,
					children: m[2] ? parseInline(m[2], opts) : [],
				});
				pos += (m[0] as string).length;
			} else {
				text(":");
				pos++;
			}
		} else if (
			opts.gfm &&
			(ch === "h" || ch === "w") &&
			(pos === 0 || /[\s*_~(]/.test(src[pos - 1] as string))
		) {
			const m = WWW.exec(src.slice(pos));
			if (m) {
				let url = m[0] as string;
				// A trailing `)` belongs to the URL only while its parentheses balance.
				while (
					url.endsWith(")") &&
					(url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)
				)
					url = url.slice(0, -1);
				url = url.replace(/&[a-zA-Z0-9]+;$/, "");
				append({
					type: "link",
					href: encodeUrl(url.startsWith("www.") ? `http://${url}` : url),
					title: "",
					children: [{ type: "text", value: url }],
				});
				pos += url.length;
			} else {
				text(ch);
				pos++;
			}
		} else {
			const next = src.slice(pos + 1).search(/[\\`*_~[\]!<&\n:hw]/);
			const end = next === -1 ? src.length : pos + 1 + next;
			text(src.slice(pos, end));
			pos = end;
		}
	}
	processEmphasis(null);

	const out: Inline[] = [];
	for (let it: Item | null = head; it; it = it.next) {
		const last = out.at(-1);
		if (it.node.type === "text" && last?.type === "text")
			last.value += it.node.value;
		else if (!(it.node.type === "text" && it.node.value === ""))
			out.push(it.node);
	}
	const last = out.at(-1);
	if (last?.type === "text") last.value = last.value.replace(/ +$/, "");
	return out;
}

export function plainText(nodes: Inline[]): string {
	return nodes
		.map((n) =>
			n.type === "text" || n.type === "code"
				? n.value
				: n.type === "image"
					? n.alt
					: n.type === "break"
						? "\n"
						: "children" in n
							? plainText(n.children)
							: "",
		)
		.join("");
}
