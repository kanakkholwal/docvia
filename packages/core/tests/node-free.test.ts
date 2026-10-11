import { readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// @docvia/core must run on Cloudflare Workers and in browsers, where Node built-ins and globals are absent.
const SRC = join(import.meta.dirname, "..", "src");
const BUILTINS = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));
const NODE_GLOBALS =
	/\b(?:process\.(?:env|cwd|argv|platform)|Buffer\.|__dirname|__filename|require\()/;

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? files(join(dir, entry.name))
			: [join(dir, entry.name)],
	);
}

describe("@docvia/core stays Node-free", () => {
	const sources = files(SRC).filter((f) => /\.(ts|tsx|svelte)$/.test(f));

	it("imports no Node built-in", () => {
		const offenders = sources.flatMap((file) =>
			[
				...readFileSync(file, "utf8").matchAll(
					/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g,
				),
			]
				.map((m) => m[1] as string)
				.filter(
					(spec) =>
						BUILTINS.has(spec) || BUILTINS.has(spec.split("/")[0] as string),
				)
				.map((spec) => `${relative(SRC, file)}: ${spec}`),
		);
		expect(offenders).toEqual([]);
	});

	it("uses no Node global outside comments", () => {
		const offenders = sources.flatMap((file) =>
			readFileSync(file, "utf8")
				.split("\n")
				.filter(
					(line) =>
						!/^\s*(?:\/\/|\*|\/\*)/.test(line) && NODE_GLOBALS.test(line),
				)
				.map((line) => `${relative(SRC, file)}: ${line.trim()}`),
		);
		expect(offenders).toEqual([]);
	});
});
