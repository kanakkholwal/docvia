import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { openapi } from "../src/index";
import { loadSpec, parseBlockMeta } from "../src/spec";

const fixturePath = resolve(__dirname, "./fixtures/petstore.json");

const file = {
	path: fixturePath,
	relativePath: "test.md",
	content: "",
	hash: "test",
} as const;

describe("parseBlockMeta", () => {
	it("parses well-formed METHOD /path", () => {
		expect(parseBlockMeta("GET /pets")).toEqual({
			method: "get",
			path: "/pets",
		});
		expect(parseBlockMeta("post /pets/{id}")).toEqual({
			method: "post",
			path: "/pets/{id}",
		});
	});

	it("returns null for malformed meta", () => {
		expect(parseBlockMeta(null)).toBeNull();
		expect(parseBlockMeta("")).toBeNull();
		expect(parseBlockMeta("not a method")).toBeNull();
		expect(parseBlockMeta("GET")).toBeNull();
	});
});

describe("loadSpec", () => {
	it("loads JSON specs and produces a content hash", async () => {
		const spec = await loadSpec(fixturePath);
		expect(spec.doc.info?.title).toBe("Petstore");
		expect(spec.hash).toMatch(/^[a-f0-9]{16}$/);
		expect(spec.doc.paths?.["/pets"]?.get?.summary).toBe("List all pets");
	});

	it("throws docviaError when the spec is missing", async () => {
		await expect(
			loadSpec(resolve(__dirname, "./fixtures/does-not-exist.json")),
		).rejects.toMatchObject({ code: "CONFIG_ERROR" });
	});
});

describe("openapi plugin", () => {
	it("replaces a matching fenced block with rendered nodes", async () => {
		const plugin = openapi({ spec: fixturePath });
		const ast = {
			type: "root",
			children: [
				{
					type: "code",
					lang: "openapi",
					meta: "GET /pets",
					value: "",
				},
			],
		};
		await plugin.afterParse?.(ast, file);
		const children = ast.children as Array<{ type: string }>;
		expect(children[0]!.type).toBe("heading");
		const headings = children.filter((c) => c.type === "heading");
		expect(headings.length).toBeGreaterThanOrEqual(2);
		// The fenced openapi block must be gone.
		expect(children.some((c) => c.type === "code" && (c as { lang?: string }).lang === "openapi")).toBe(false);
	});

	it("descends into nested parent nodes", async () => {
		const plugin = openapi({ spec: fixturePath });
		const ast = {
			type: "root",
			children: [
				{
					type: "blockquote",
					children: [
						{
							type: "code",
							lang: "openapi",
							meta: "POST /pets",
							value: "",
						},
					],
				},
			],
		};
		await plugin.afterParse?.(ast, file);
		const blockquote = (ast.children as Array<{ children: Array<{ type: string }> }>)[0]!;
		expect(blockquote.children[0]!.type).toBe("heading");
	});

	it("throws by default when the path is missing", async () => {
		const plugin = openapi({ spec: fixturePath });
		const ast = {
			type: "root",
			children: [
				{
					type: "code",
					lang: "openapi",
					meta: "GET /unknown",
					value: "",
				},
			],
		};
		await expect(plugin.afterParse?.(ast, file)).rejects.toMatchObject({
			code: "PLUGIN_ERROR",
		});
	});

	it("warns and leaves the block when onMissing is 'warn'", async () => {
		const plugin = openapi({ spec: fixturePath, onMissing: "warn" });
		const ast = {
			type: "root",
			children: [
				{
					type: "code",
					lang: "openapi",
					meta: "GET /unknown",
					value: "",
				},
			],
		};
		const originalWarn = console.warn;
		console.warn = () => {};
		try {
			await plugin.afterParse?.(ast, file);
		} finally {
			console.warn = originalWarn;
		}
		const children = ast.children as Array<{ type: string; lang?: string }>;
		expect(children[0]!.type).toBe("code");
		expect(children[0]!.lang).toBe("openapi");
	});

	it("ignores blocks with unrelated languages", async () => {
		const plugin = openapi({ spec: fixturePath });
		const ast = {
			type: "root",
			children: [
				{ type: "code", lang: "typescript", value: "const x = 1;" },
				{ type: "code", lang: "openapi", meta: "GET /pets", value: "" },
			],
		};
		await plugin.afterParse?.(ast, file);
		const children = ast.children as Array<{ type: string; lang?: string }>;
		expect(children[0]!.type).toBe("code");
		expect(children[0]!.lang).toBe("typescript");
		// Original openapi block replaced with heading.
		expect(children[1]!.type).toBe("heading");
	});
});
