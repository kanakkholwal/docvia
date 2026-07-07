import { readFileSync } from "node:fs";

let cached: string | undefined;

/**
 * The CLI's own version, read from its `package.json` at runtime.
 *
 * `import.meta.url` resolves to the bundled `dist/index.mjs` (and `bin.mjs`
 * imports that), so `../package.json` lands on the package root in both a
 * workspace checkout and a published install — where `dist/` and
 * `package.json` sit side by side. Falls back to "0.0.0" if anything moves.
 */
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
