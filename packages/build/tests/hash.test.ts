import { describe, expect, it } from "vitest";
import { computeContentHash, hashConfig, stableStringify } from "../src/hash";

describe("computeContentHash", () => {
	const base = {
		fileContent: "const x = 1;",
		frontmatter: "title: Test",
		configHash: "config123",
		pluginCacheKeys: ["key1", "key2"],
		dependencyHashes: ["dep1"],
	};

	it("is deterministic for identical inputs", () => {
		expect(computeContentHash(base)).toBe(computeContentHash(base));
	});

	it("changes when any input changes", () => {
		const h0 = computeContentHash(base);
		expect(computeContentHash({ ...base, fileContent: "other" })).not.toBe(h0);
		expect(computeContentHash({ ...base, frontmatter: "title: X" })).not.toBe(
			h0,
		);
		expect(computeContentHash({ ...base, configHash: "other" })).not.toBe(h0);
		expect(
			computeContentHash({ ...base, pluginCacheKeys: ["key2", "key1"] }),
		).not.toBe(h0);
	});

	it("returns a base36-encoded string", () => {
		expect(/^[0-9a-z]+$/.test(computeContentHash(base))).toBe(true);
	});
});

describe("stableStringify", () => {
	it("is independent of key declaration order", () => {
		expect(stableStringify({ a: 1, b: 2 })).toBe(
			stableStringify({ b: 2, a: 1 }),
		);
	});

	it("replaces function values with a placeholder", () => {
		expect(stableStringify({ fn: () => 1 })).toBe('{"fn":"<fn>"}');
	});
});

describe("hashConfig", () => {
	it("is stable across reordered keys", () => {
		expect(hashConfig({ x: 1, y: 2 })).toBe(hashConfig({ y: 2, x: 1 }));
	});
});
