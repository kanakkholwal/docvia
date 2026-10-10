import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { type ApiDocument, buildApiDocument, loadSpec } from "../src/index";
import { apiSource, openapiSource } from "../src/source";

let api: ApiDocument;
const op = (slug: string) => {
	const found = api.operations.find((o) => o.slug === slug);
	if (!found) throw new Error(`no operation ${slug}`);
	return found;
};

beforeAll(async () => {
	const { doc } = await loadSpec(resolve(__dirname, "fixtures/library.yaml"));
	api = await buildApiDocument(doc, {
		highlight: (code, lang) => `<pre data-lang="${lang}">${code.length}</pre>`,
	});
});

describe("buildApiDocument", () => {
	it("reads YAML 3.0, fills server variables and renders Markdown", () => {
		expect(api.title).toBe("Library");
		expect(api.servers[0]?.url).toBe("https://eu.library.test/v2");
		expect(api.description).toBe("<p>Books and <strong>loans</strong>.</p>");
		expect(api.tags.map((t) => t.slug)).toEqual(["books"]);
	});

	it("merges path-level parameters and follows parameter and response refs", () => {
		const get = op("get-book");
		expect(get.parameters.map((p) => `${p.in}:${p.name}`)).toEqual([
			"path:bookId",
			"query:fields",
		]);
		expect(get.parameters[0]?.schema.constraints).toEqual([">= 1"]);
		expect(get.parameters[0]?.example).toBe("42");
		expect(get.responses.map((r) => r.status)).toEqual(["200", "404"]);
		expect(get.responses[1]?.description).toBe("<p>No such book.</p>");
		expect(get.responses[0]?.headers[0]?.name).toBe("ETag");
	});

	it("merges allOf, keeps ref names, upgrades nullable and marks cycles", () => {
		const book = op("get-book").responses[0]?.contents[0]?.schema;
		expect(book?.type).toBe("Book");
		const fields = Object.fromEntries(
			(book?.fields ?? []).map((f) => [f.name, f]),
		);
		expect(Object.keys(fields)).toEqual([
			"title",
			"format",
			"author",
			"id",
			"subtitle",
		]);
		expect(fields.title?.required && fields.id?.required).toBe(true);
		expect(fields.subtitle?.schema.type).toBe("string | null");
		expect(fields.format?.schema.enum).toEqual(['"hardcover"', '"ebook"']);
		const person = fields.author?.schema.variants?.options[0];
		expect(person?.type).toBe("Person");
		expect(
			person?.fields?.find((f) => f.name === "mentor")?.schema.circular,
		).toBe(true);
	});

	it("drops readOnly fields from request examples and keeps them in responses", () => {
		const request = JSON.parse(
			op("create-book").requestBody?.contents[0]?.examples[0]?.code ?? "",
		);
		expect(request).toEqual({
			title: "string",
			format: "hardcover",
			author: { name: "string", mentor: {} },
		});
		const response = JSON.parse(
			op("get-book").responses[0]?.contents[0]?.examples[0]?.code ?? "",
		);
		expect(response.id).toBe(0);
	});

	it("generates code samples with examples and placeholder auth", () => {
		const curl = op("get-book").samples.find((s) => s.id === "shell-curl");
		expect(curl?.code).toContain("https://eu.library.test/v2/books/42");
		expect(curl?.code).toContain("Authorization: Bearer <token>");
		expect(curl?.html).toBe(`<pre data-lang="bash">${curl?.code.length}</pre>`);
		const create = op("create-book").samples.find((s) => s.id === "shell-curl");
		expect(create?.code).toContain("X-Api-Key: <api-key>");
		expect(op("get-book").samples.map((s) => s.label)).toEqual([
			"cURL",
			"JavaScript",
			"Python",
			"Go",
		]);
	});

	it("treats an empty security list as no auth and names unnamed operations", () => {
		const health = op("get-health");
		expect(health.security).toEqual([]);
		expect(health.summary).toBe("GET /health");
		expect(health.samples[0]?.code).not.toContain("Authorization");
	});
});

describe("openapiSource", () => {
	it("lays out an overview, a folder per tag and a page per operation", async () => {
		const { files } = openapiSource(apiSource(api), {
			dir: "reference",
			baseUrl: "/docs",
		});
		expect(files.map((f) => f.path)).toEqual([
			"reference/index.md",
			"reference/meta.json",
			"reference/books/meta.json",
			"reference/books/index.md",
			"reference/books/get-book.md",
			"reference/books/create-book.md",
			"reference/get-health.md",
		]);
		const page = files.find((f) => f.path === "reference/books/get-book.md");
		if (page?.type !== "page") throw new Error("missing page");
		const loaded = await page.data.load();
		expect(loaded.content).toMatchObject({
			kind: "component",
			name: "APIOperation",
		});
		expect(loaded.headings.map((h) => h.id)).toEqual([
			"authorization",
			"path-parameters",
			"query-parameters",
			"responses",
		]);

		const index = files[0];
		if (index?.type !== "page") throw new Error("missing index");
		const overview = (await index.data.load()).content.props.api as {
			groups: Array<{ name: string; operations: Array<{ url: string }> }>;
		};
		expect(overview.groups.map((g) => g.name)).toEqual(["Books", "Other"]);
		expect(overview.groups[0]?.operations[0]?.url).toBe(
			"/docs/reference/books/get-book",
		);
	});
});

describe("schema types", () => {
	it("shows a bare null option as null", async () => {
		const { parseSpec } = await import("../src/index");
		const doc = parseSpec(
			JSON.stringify({
				openapi: "3.1.0",
				info: { title: "t", version: "1" },
				paths: {
					"/x": {
						get: {
							responses: {
								"200": {
									description: "ok",
									content: {
										"application/json": {
											schema: { oneOf: [{ type: "string" }, { type: "null" }] },
										},
									},
								},
							},
						},
					},
				},
			}),
			"inline",
		);
		const built = await buildApiDocument(doc);
		const options =
			built.operations[0]?.responses[0]?.contents[0]?.schema?.variants?.options;
		expect(options?.map((o) => o.type)).toEqual(["string", "null"]);
	});
});
