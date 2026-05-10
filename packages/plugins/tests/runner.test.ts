import type {
	docviaPlugin,
	FileEntry,
	FrontmatterData,
	IRDocument,
} from "@docvia/ir";
import { describe, expect, it, vi } from "vitest";
import { PluginRunner, resolvePlugins } from "../src/index";

describe("resolvePlugins", () => {
	it("validates plugin names are present", () => {
		const plugins: docviaPlugin[] = [
			{
				name: "",
				version: "1.0.0",
			},
		];

		expect(() => resolvePlugins(plugins)).toThrow();
	});

	it("validates plugin versions are present", () => {
		const plugins: docviaPlugin[] = [
			{
				name: "test-plugin",
				version: "",
			},
		];

		expect(() => resolvePlugins(plugins)).toThrow();
	});

	it("rejects duplicate plugin names", () => {
		const plugins: docviaPlugin[] = [
			{ name: "duplicate", version: "1.0.0" },
			{ name: "duplicate", version: "2.0.0" },
		];

		expect(() => resolvePlugins(plugins)).toThrow();
	});

	it("sorts plugins by phase and priority", () => {
		const plugins: docviaPlugin[] = [
			{ name: "normal-100", version: "1.0.0", phase: "normal", priority: 100 },
			{ name: "pre-50", version: "1.0.0", phase: "pre", priority: 50 },
			{ name: "post-100", version: "1.0.0", phase: "post", priority: 100 },
			{ name: "normal-50", version: "1.0.0", phase: "normal", priority: 50 },
		];

		const resolved = resolvePlugins(plugins);

		expect(resolved[0]?.name).toBe("pre-50");
		expect(resolved[1]?.name).toBe("normal-50");
		expect(resolved[2]?.name).toBe("normal-100");
		expect(resolved[3]?.name).toBe("post-100");
	});

	it("defaults phase to normal and priority to 100", () => {
		const plugins: docviaPlugin[] = [{ name: "default", version: "1.0.0" }];

		const resolved = resolvePlugins(plugins);
		expect(resolved[0]?.phase).toBeUndefined(); // Uses default 'normal' in sort
		expect(resolved[0]?.priority).toBeUndefined(); // Uses default 100 in sort
	});

	it("preserves plugin data during resolution", () => {
		const plugin: docviaPlugin = {
			name: "test",
			version: "1.0.0",
			beforeParse: async (file) => file,
		};

		const resolved = resolvePlugins([plugin]);
		expect(resolved[0]).toBe(plugin);
	});
});

describe("PluginRunner", () => {
	const mockFile: FileEntry = {
		path: "/docs/test.md",
		relativePath: "test.md",
		content: "# Test",
		hash: "abc123",
	};

	const mockFrontmatter: FrontmatterData = {
		title: "Test",
		description: "Test",
		tags: [],
	};

	const mockDoc: IRDocument = {
		slug: "test",
		frontmatter: mockFrontmatter,
		children: [],
		headings: [],
		dependencies: [],
		contentHash: "hash123",
	};

	it("runs beforeParse hook in order", async () => {
		const order: string[] = [];

		const plugin1: docviaPlugin = {
			name: "plugin1",
			version: "1.0.0",
			beforeParse: async (file) => {
				order.push("plugin1");
				return file;
			},
		};

		const plugin2: docviaPlugin = {
			name: "plugin2",
			version: "1.0.0",
			beforeParse: async (file) => {
				order.push("plugin2");
				return file;
			},
		};

		const runner = new PluginRunner([plugin1, plugin2]);
		await runner.runBeforeParse(mockFile);

		expect(order).toEqual(["plugin1", "plugin2"]);
	});

	it("runs afterParse hook in order", async () => {
		const order: string[] = [];

		const plugin1: docviaPlugin = {
			name: "plugin1",
			version: "1.0.0",
			afterParse: async (ast) => {
				order.push("plugin1");
				return ast;
			},
		};

		const plugin2: docviaPlugin = {
			name: "plugin2",
			version: "1.0.0",
			afterParse: async (ast) => {
				order.push("plugin2");
				return ast;
			},
		};

		const runner = new PluginRunner([plugin1, plugin2]);
		await runner.runAfterParse({}, mockFile);

		expect(order).toEqual(["plugin1", "plugin2"]);
	});

	it("runs beforeTransform hook", async () => {
		const plugin: docviaPlugin = {
			name: "test",
			version: "1.0.0",
			beforeTransform: vi.fn(async (ast) => ast),
		};

		const runner = new PluginRunner([plugin]);
		await runner.runBeforeTransform({}, mockFrontmatter);

		expect(plugin.beforeTransform).toHaveBeenCalled();
	});

	it("runs afterTransform hook and passes document", async () => {
		const hook = vi.fn(async (doc: IRDocument) => doc);
		const plugin: docviaPlugin = {
			name: "test",
			version: "1.0.0",
			afterTransform: hook,
		};

		const runner = new PluginRunner([plugin]);
		await runner.runAfterTransform(mockDoc);

		expect(hook).toHaveBeenCalledWith(mockDoc);
	});

	it("runs beforeRender hook", async () => {
		const hook = vi.fn(async (doc: IRDocument) => doc);
		const plugin: docviaPlugin = {
			name: "test",
			version: "1.0.0",
			beforeRender: hook,
		};

		const runner = new PluginRunner([plugin]);
		await runner.runBeforeRender(mockDoc);

		expect(hook).toHaveBeenCalledWith(mockDoc);
	});

	it("generates cache keys from plugins", () => {
		const plugin: docviaPlugin = {
			name: "test-plugin",
			version: "2.5.1",
		};

		const runner = new PluginRunner([plugin]);
		const keys = runner.getPluginCacheKeys();

		expect(keys).toContain("test-plugin@2.5.1");
	});

	it("uses custom cacheKey when provided", () => {
		const plugin: docviaPlugin = {
			name: "test-plugin",
			version: "1.0.0",
			cacheKey: () => "custom-cache-key",
		};

		const runner = new PluginRunner([plugin]);
		const keys = runner.getPluginCacheKeys();

		expect(keys).toContain("custom-cache-key");
	});

	it("handles plugins without optional hooks", async () => {
		const plugin: docviaPlugin = {
			name: "minimal",
			version: "1.0.0",
		};

		const runner = new PluginRunner([plugin]);

		// Should not throw
		await runner.runBeforeParse(mockFile);
		await runner.runAfterParse({}, mockFile);
		await runner.runBeforeTransform({}, mockFrontmatter);
		await runner.runAfterTransform(mockDoc);
		await runner.runBeforeRender(mockDoc);
	});

	it("chains hook results through plugins", async () => {
		const plugin1: docviaPlugin = {
			name: "add-suffix",
			version: "1.0.0",
			beforeParse: async (file) => ({
				...file,
				content: `${file.content}-modified`,
			}),
		};

		const plugin2: docviaPlugin = {
			name: "add-suffix-2",
			version: "1.0.0",
			beforeParse: async (file) => ({
				...file,
				content: `${file.content}-again`,
			}),
		};

		const runner = new PluginRunner([plugin1, plugin2]);
		const result = await runner.runBeforeParse(mockFile);

		expect(result.content).toBe("# Test-modified-again");
	});
});
