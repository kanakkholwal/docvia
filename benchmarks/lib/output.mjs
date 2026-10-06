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
