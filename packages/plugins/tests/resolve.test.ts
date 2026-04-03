import type { docviaPlugin } from "@docvia/ir";
import { describe, expect, it } from "vitest";
import { resolvePlugins } from "../src/index";

describe("resolvePlugins sorting", () => {
	it("prioritizes pre-phase plugins first", () => {
		const plugins: docviaPlugin[] = [
			{ name: "normal", version: "1.0.0", phase: "normal" },
			{ name: "pre", version: "1.0.0", phase: "pre" },
		];

		const resolved = resolvePlugins(plugins);
		expect(resolved[0]?.name).toBe("pre");
	});

	it("prioritizes normal-phase plugins before post", () => {
		const plugins: docviaPlugin[] = [
			{ name: "post", version: "1.0.0", phase: "post" },
			{ name: "normal", version: "1.0.0", phase: "normal" },
		];

		const resolved = resolvePlugins(plugins);
		expect(resolved[0]?.name).toBe("normal");
	});

	it("sorts by priority within same phase", () => {
		const plugins: docviaPlugin[] = [
			{ name: "p-200", version: "1.0.0", phase: "normal", priority: 200 },
			{ name: "p-50", version: "1.0.0", phase: "normal", priority: 50 },
			{ name: "p-100", version: "1.0.0", phase: "normal", priority: 100 },
		];

		const resolved = resolvePlugins(plugins);
		expect(resolved.map((p) => p.name)).toEqual(["p-50", "p-100", "p-200"]);
	});

	it("handles mixed phases and priorities", () => {
		const plugins: docviaPlugin[] = [
			{ name: "p-pre-100", version: "1.0.0", phase: "pre", priority: 100 },
			{ name: "n-normal-50", version: "1.0.0", phase: "normal", priority: 50 },
			{ name: "p-post-200", version: "1.0.0", phase: "post", priority: 200 },
			{ name: "p-pre-50", version: "1.0.0", phase: "pre", priority: 50 },
			{
				name: "n-normal-100",
				version: "1.0.0",
				phase: "normal",
				priority: 100,
			},
		];

		const resolved = resolvePlugins(plugins);
		const names = resolved.map((p) => p.name);

		// Pre-phase first (sorted by priority)
		expect(names.indexOf("p-pre-50")).toBeLessThan(names.indexOf("p-pre-100"));

		// Normal phase second (sorted by priority)
		expect(names.indexOf("n-normal-50")).toBeLessThan(
			names.indexOf("n-normal-100"),
		);

		// All pre before normal
		expect(names.indexOf("p-pre-100")).toBeLessThan(
			names.indexOf("n-normal-50"),
		);

		// All normal before post
		expect(names.indexOf("n-normal-100")).toBeLessThan(
			names.indexOf("p-post-200"),
		);
	});

	it("returns new array (does not mutate input)", () => {
		const plugins: docviaPlugin[] = [
			{ name: "b", version: "1.0.0" },
			{ name: "a", version: "1.0.0" },
		];

		const original = [...plugins];
		const resolved = resolvePlugins(plugins);

		expect(plugins).toEqual(original);
		expect(resolved).not.toBe(plugins);
	});

	it("validates all plugins have proper structure", () => {
		const plugins: docviaPlugin[] = [{ name: "valid", version: "1.0.0" }];

		const resolved = resolvePlugins(plugins);
		for (const p of resolved) {
			expect(p.name).toBeDefined();
			expect(p.version).toBeDefined();
		}
	});

	it("throws for missing plugin name", () => {
		const plugins: any[] = [
			{ version: "1.0.0" }, // Missing name
		];

		expect(() => resolvePlugins(plugins)).toThrow("Plugin missing name");
	});

	it("throws for missing plugin version", () => {
		const plugins: any[] = [
			{ name: "test" }, // Missing version
		];

		expect(() => resolvePlugins(plugins)).toThrow("missing version");
	});

	it("handles zero plugins", () => {
		const resolved = resolvePlugins([]);
		expect(resolved).toEqual([]);
	});

	it("handles single plugin", () => {
		const plugin: docviaPlugin = { name: "single", version: "1.0.0" };
		const resolved = resolvePlugins([plugin]);

		expect(resolved).toHaveLength(1);
		expect(resolved[0]).toBe(plugin);
	});

	it("preserves plugin identity through sorting", () => {
		const plugins: docviaPlugin[] = [
			{ name: "a", version: "1.0.0", phase: "post", extraData: "test" } as any,
			{ name: "b", version: "1.0.0", phase: "pre" },
		];

		const resolved = resolvePlugins(plugins);

		// Find plugins by name to verify identity
		const pluginB = resolved.find((p) => p.name === "b");
		const pluginA = resolved.find((p) => p.name === "a");

		expect(pluginB).toBe(plugins[1]);
		expect(pluginA).toBe(plugins[0]);
		expect((pluginA as any).extraData).toBe("test");
	});
});
