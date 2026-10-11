import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { type ApiDocument, buildApiDocument, loadSpec } from "../src/index";
import {
	buildRequestHeaders,
	buildRequestUrl,
	defaultServer,
	missingParameters,
	paramKey,
	prettyBody,
	resolveServerUrl,
} from "../src/source";

let api: ApiDocument;
const op = (slug: string) => {
	const found = api.operations.find((o) => o.slug === slug);
	if (!found) throw new Error(`no operation ${slug}`);
	return found;
};

beforeAll(async () => {
	const { doc } = await loadSpec(resolve(__dirname, "fixtures/library.yaml"));
	api = await buildApiDocument(doc);
});

describe("request helpers", () => {
	it("fills path parameters, keeps unfilled ones and skips empty query values", () => {
		const get = op("get-book");
		const server = "https://eu.library.test/v2";
		expect(
			buildRequestUrl(get, server, {
				[paramKey("path", "bookId")]: "7",
				[paramKey("query", "fields")]: "",
			}),
		).toBe("https://eu.library.test/v2/books/7");
		expect(
			buildRequestUrl(get, `${server}/`, {
				[paramKey("query", "fields")]: "a b",
			}),
		).toBe("https://eu.library.test/v2/books/{bookId}?fields=a+b");
		expect(missingParameters(get, {})).toEqual(["bookId"]);
	});

	it("prefers a server on the page origin and resolves relative URLs", () => {
		const get = op("get-book");
		const local = { ...get, servers: [...get.servers, { url: "/mock" }] };
		expect(defaultServer(get, "https://docs.test")).toBe(
			"https://eu.library.test/v2",
		);
		expect(defaultServer(local, "https://docs.test")).toBe("/mock");
		expect(resolveServerUrl("/mock", "https://docs.test")).toBe(
			"https://docs.test/mock",
		);
	});

	it("puts credentials where each scheme expects them", () => {
		const bearer = buildRequestHeaders(
			op("get-book"),
			{},
			op("get-book").security[0] ?? [],
			{ bearer: "t0k" },
			undefined,
		);
		expect(bearer.headers.get("authorization")).toBe("Bearer t0k");
		const key = buildRequestHeaders(
			op("create-book"),
			{},
			op("create-book").security[0] ?? [],
			{ apiKey: "k" },
			"application/json",
		);
		expect(key.headers.get("x-api-key")).toBe("k");
		expect(key.headers.get("content-type")).toBe("application/json");
		const empty = buildRequestHeaders(
			op("get-book"),
			{},
			op("get-book").security[0] ?? [],
			{},
			undefined,
		);
		expect(empty.headers.has("authorization")).toBe(false);
	});

	it("re-indents JSON bodies only", () => {
		expect(prettyBody('{"a":1}', "application/json; charset=utf-8")).toBe(
			'{\n  "a": 1\n}',
		);
		expect(prettyBody("{oops", "application/json")).toBe("{oops");
		expect(prettyBody('{"a":1}', "text/plain")).toBe('{"a":1}');
	});
});
