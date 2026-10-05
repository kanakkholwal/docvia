import { readFileSync } from "node:fs";

let cached: string | undefined;

/** The CLI's version from `../package.json` (beside `dist/`), or "0.0.0" if it moved. */
export function getVersion(): string {
	if (cached !== undefined) return cached;
	try {
		const url = new URL("../package.json", import.meta.url);
		const pkg = JSON.parse(readFileSync(url, "utf-8")) as { version?: string };
		cached = pkg.version ?? "0.0.0";
	} catch {
		cached = "0.0.0";
	}
	return cached;
}
