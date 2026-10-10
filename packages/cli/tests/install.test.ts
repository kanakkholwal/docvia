import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dependenciesFor } from "../src/init/install";

const published = new Set(
	readdirSync(join(import.meta.dirname, "..", ".."), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => {
			const manifest = join(
				import.meta.dirname,
				"..",
				"..",
				entry.name,
				"package.json",
			);
			return (JSON.parse(readFileSync(manifest, "utf8")) as { name: string })
				.name;
		}),
);

describe("dependenciesFor", () => {
	it("installs only packages that exist in this repo, never subpaths", () => {
		for (const framework of [
			"next",
			"sveltekit",
			"tanstack-start",
			"standalone",
		] as const) {
			const { runtime, dev } = dependenciesFor(framework);
			for (const name of [...runtime, ...dev])
				expect(published, `${framework}: ${name}`).toContain(name);
		}
	});
});
