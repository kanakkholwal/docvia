import type { Attributes } from "./ast";

export const ENTITY_RE =
	/^&(?:#[xX][a-fA-F0-9]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/;

// The full HTML table has ~2,100 names; these cover what prose and docs actually use.
const NAMED: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
	copy: "©",
	reg: "®",
	trade: "™",
	hellip: "…",
	mdash: "—",
	ndash: "–",
	lsquo: "‘",
	rsquo: "’",
	ldquo: "“",
	rdquo: "”",
	laquo: "«",
	raquo: "»",
	bull: "•",
	middot: "·",
	deg: "°",
	plusmn: "±",
	times: "×",
	divide: "÷",
	ne: "≠",
	le: "≤",
	ge: "≥",
	larr: "←",
	rarr: "→",
	uarr: "↑",
	darr: "↓",
	harr: "↔",
	euro: "€",
	pound: "£",
	yen: "¥",
	cent: "¢",
	sect: "§",
	para: "¶",
	frac12: "½",
	frac14: "¼",
	frac34: "¾",
	auml: "ä",
	ouml: "ö",
	uuml: "ü",
	Auml: "Ä",
	Ouml: "Ö",
	Uuml: "Ü",
	szlig: "ß",
	eacute: "é",
	egrave: "è",
	aacute: "á",
	ntilde: "ñ",
	ccedil: "ç",
};

function decodeOne(entity: string): string {
	const body = entity.slice(1, -1);
	if (body[0] === "#") {
		const code =
			body[1] === "x" || body[1] === "X"
				? Number.parseInt(body.slice(2), 16)
				: Number.parseInt(body.slice(1), 10);
		return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)
			? "�"
			: String.fromCodePoint(code);
	}
	return NAMED[body] ?? entity;
}

export function decodeEntities(value: string): string {
	return value.includes("&")
		? value.replace(
				/&(?:#[xX][a-fA-F0-9]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/g,
				decodeOne,
			)
		: value;
}

/** Backslash escapes and entities, as in link destinations, titles and code info strings. */
export function unescapeString(value: string): string {
	return decodeEntities(value.replace(/\\([!-/:-@[-`{-~])/g, "$1"));
}

/** Link label matching: trim, collapse whitespace, case-fold. */
export function normalizeLabel(label: string): string {
	return label
		.trim()
		.replace(/[ \t\r\n]+/g, " ")
		.toLowerCase()
		.toUpperCase();
}

const HTML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
};

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] as string);
}

// Ported from mdurl's encode (MIT): percent-encodes a URL, keeping valid escapes and URL punctuation.
const SAFE = /[A-Za-z0-9;/?:@&=+$,\-_.!~*'()#]/;
export function encodeUrl(url: string): string {
	let out = "";
	for (let i = 0; i < url.length; i++) {
		const ch = url[i] as string;
		if (ch === "%" && /^[0-9a-fA-F]{2}$/.test(url.slice(i + 1, i + 3))) {
			out += url.slice(i, i + 3);
			i += 2;
		} else if (SAFE.test(ch)) {
			out += ch;
		} else {
			const code = ch.charCodeAt(0);
			if (code >= 0xd800 && code <= 0xdbff && i + 1 < url.length) {
				out += encodeURIComponent(ch + url[i + 1]);
				i++;
			} else {
				out +=
					code >= 0xd800 && code <= 0xdfff
						? "%EF%BF%BD"
						: encodeURIComponent(ch);
			}
		}
	}
	return out;
}

/** GitHub-style heading ids: lowercase, punctuation dropped, spaces to hyphens. */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\p{L}\p{N}\s_-]/gu, "")
		.replace(/\s/g, "-");
}

/** `{#id .class key=value key="quoted value"}` without the braces. */
export function parseAttributes(source: string): Attributes {
	const out: Attributes = {};
	const re = /([#.])([\w-]+)|([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
	for (const m of source.matchAll(re)) {
		if (m[1] === "#") out.id = m[2] as string;
		else if (m[1] === ".")
			out.class = out.class ? `${out.class} ${m[2]}` : (m[2] as string);
		else if (m[3]) out[m[3]] = m[4] ?? m[5] ?? m[6] ?? "";
	}
	return out;
}
