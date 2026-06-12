import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createFetchClient,
	createFromSource,
	createSearchHandler,
	extractSectionsFromContent,
} from "../src/index";

// A small rendered page (RenderOutput fragment) mirroring what a `?docvia`
// module exports as `content` at runtime: headings carry their anchor in
// `props.id`, body text lives in `text` nodes, code arrives as `html`.
const content = {
	kind: "fragment" as const,
	children: [
		{
			kind: "element" as const,
			tag: "p",
			children: [
				{ kind: "text" as const, value: "An intro before any heading." },
			],
		},
		{
			kind: "element" as const,
			tag: "h2",
			props: { id: "install" },
			children: [{ kind: "text" as const, value: "Install" }],
		},
		{
			kind: "element" as const,
			tag: "p",
			children: [
				{ kind: "text" as const, value: "Run the installer for widgets." },
			],
		},
		{
			kind: "element" as const,
			tag: "pre",
			children: [
				{ kind: "html" as const, value: "<span>npm i widgets</span>" },
			],
		},
	],
};

describe("extractSectionsFromContent", () => {
	it("splits content into a _top section plus one per heading", () => {
		const sections = extractSectionsFromContent(content, {
			slug: "guide",
			pageTitle: "Guide",
		});

		expect(sections).toHaveLength(2);

		const top = sections[0]!;
		expect(top.sectionId).toBe("_top");
		expect(top.sectionTitle).toBe("Guide"); // falls back to page title
		expect(top.content).toContain("An intro before any heading.");
		expect(top.depth).toBe(0);

		const install = sections[1]!;
		expect(install.sectionId).toBe("install"); // from heading props.id
		expect(install.sectionTitle).toBe("Install");
		expect(install.depth).toBe(2);
		expect(install.content).toContain("Run the installer for widgets.");
		// html (highlighted code) is stripped to text and indexed
		expect(install.content).toContain("npm i widgets");
	});

	it("does not fold heading text into the section body", () => {
		const install = extractSectionsFromContent(content, {
			slug: "guide",
			pageTitle: "Guide",
		})[1]!;
		expect(install.content).not.toContain("Install");
	});

	it("returns nothing for empty content", () => {
		expect(
			extractSectionsFromContent(undefined, { slug: "x", pageTitle: "X" }),
		).toHaveLength(0);
	});
});

function makeSource() {
	return {
		getPages: () => [{ slugs: ["guide"] }],
		getPage: async () => ({ data: { title: "Guide" }, content }),
	};
}

describe("createFromSource", () => {
	it("indexes a source and answers queries", async () => {
		const server = await createFromSource(makeSource());
		expect(server.size).toBe(2);

		const hits = await server.search("widgets");
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0]!.pageTitle).toBe("Guide");
		expect(hits[0]!.slug).toBe("guide");
	});

	it("accepts a whole source ({ collections })", async () => {
		const server = await createFromSource({
			collections: { docs: makeSource() },
		});
		expect(server.size).toBe(2);
		expect((await server.search("installer")).length).toBeGreaterThan(0);
	});

	it("respects the limit option", async () => {
		const server = await createFromSource(makeSource());
		const hits = await server.search("widgets installer intro", { limit: 1 });
		expect(hits.length).toBeLessThanOrEqual(1);
	});
});

describe("createSearchHandler", () => {
	it("answers a Request with JSON results", async () => {
		const server = await createFromSource(makeSource());
		const handler = createSearchHandler(server);

		const res = await handler(
			new Request("https://x.dev/api/search?query=widgets"),
		);
		expect(res.headers.get("content-type")).toContain("application/json");
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBeGreaterThan(0);
	});

	it("returns an empty array for a blank query", async () => {
		const server = await createFromSource(makeSource());
		const handler = createSearchHandler(server);
		const res = await handler(new Request("https://x.dev/api/search"));
		expect(await res.json()).toEqual([]);
	});
});

describe("createFetchClient", () => {
	// Always restore the real fetch, even if an assertion throws mid-test.
	afterEach(() => vi.unstubAllGlobals());

	it("queries the endpoint and returns the parsed results", async () => {
		const fetchMock = vi.fn(
			async (_input: string) =>
				new Response(
					JSON.stringify([{ slug: "guide", sectionId: "install" }]),
					{
						headers: { "content-type": "application/json" },
					},
				),
		);
		vi.stubGlobal("fetch", fetchMock);

		const client = createFetchClient("/api/search");
		const results = await client.search("widgets", { limit: 5 });

		expect(fetchMock).toHaveBeenCalledOnce();
		const url = String(fetchMock.mock.calls[0]![0]);
		expect(url).toContain("/api/search?");
		expect(url).toContain("query=widgets");
		expect(url).toContain("limit=5");
		expect(results[0]!.slug).toBe("guide");
	});

	it("skips the request for a blank query", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const client = createFetchClient();
		expect(await client.search("  ")).toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
