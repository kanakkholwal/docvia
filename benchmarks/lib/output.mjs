import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { gzipSync } from "node:zlib";

function files(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { recursive: true })
		.map((f) => join(dir, String(f)))
		.filter((f) => statSync(f).isFile());
}

/** Bytes the browser can download: JS and CSS (raw and gzip) plus HTML, for one build output. */
export function clientOutput(dir) {
	const totals = {
		jsBytes: 0,
		jsGzip: 0,
		cssBytes: 0,
		cssGzip: 0,
		htmlBytes: 0,
	};
	for (const file of files(dir)) {
		const ext = extname(file);
		if (ext === ".js" || ext === ".mjs") {
			const body = readFileSync(file);
			totals.jsBytes += body.length;
			totals.jsGzip += gzipSync(body).length;
		} else if (ext === ".css") {
			const body = readFileSync(file);
			totals.cssBytes += body.length;
			totals.cssGzip += gzipSync(body).length;
		} else if (ext === ".html") {
			totals.htmlBytes += statSync(file).size;
		}
	}
	return totals;
}

// Minified HTML often drops attribute quotes (`src=/assets/a.js`), so accept all three forms.
const attr = (tag, name) => {
	const match = new RegExp(
		`\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
		"i",
	).exec(tag);
	return match?.[1] ?? match?.[2] ?? match?.[3];
};

/** What a browser downloads for `url` before running it: HTML, scripts, preloads and CSS, gzipped. */
export async function pageWeight(url) {
	const html = await (await fetch(url)).text();
	const scripts = new Set();
	const styles = new Set();
	for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
		const src = attr(tag, "src");
		if (src) scripts.add(new URL(src, url).href);
	}
	for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
		// `rel` is a token list: VitePress writes `rel="preload stylesheet"`.
		const rel = new Set(attr(tag, "rel")?.toLowerCase().split(/\s+/));
		const href = attr(tag, "href");
		if (!href) continue;
		if (rel.has("stylesheet")) {
			styles.add(new URL(href, url).href);
		} else if (
			rel.has("modulepreload") ||
			(rel.has("preload") && attr(tag, "as") === "script")
		) {
			scripts.add(new URL(href, url).href);
		}
	}
	const gzipped = async (urls) => {
		let total = 0;
		for (const u of urls) {
			const body = Buffer.from(await (await fetch(u)).arrayBuffer());
			total += gzipSync(body).length;
		}
		return total;
	};
	return {
		htmlGzip: gzipSync(Buffer.from(html)).length,
		jsGzip: await gzipped(scripts),
		cssGzip: await gzipped(styles),
		requests: scripts.size + styles.size,
	};
}
