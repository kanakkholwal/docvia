import type { FrontmatterSchema } from "@docvia/ir";
import { defineConfig } from "@docvia/plugins";
import { describe, expect, it } from "vitest";
import { PagePipeline } from "../src/pages";

const root = process.cwd();
const page = (title: string, body = "Text.") =>
	`---\ntitle: ${title}\n---\n\n${body}\n`;

describe("PagePipeline.meta", () => {
	it("reuses frontmatter for unchanged content and re-reads changed content", async () => {
		const pipeline = new PagePipeline(defineConfig({}), root);
		const file = `${root}/docs/a.md`;
		const first = await pipeline.meta(file, page("A"));
		expect(await pipeline.meta(file, page("A"))).toBe(first);
		const edited = await pipeline.meta(file, page("A", "Other body."));
		expect(edited).not.toBe(first);
		expect(edited.title).toBe("A");
		expect((await pipeline.meta(file, page("B"))).title).toBe("B");
	});

	it("re-validates when the collection's schema changes", async () => {
		const pipeline = new PagePipeline(defineConfig({}), root);
		const dir = `${root}/content`;
		const file = `${dir}/a.md`;
		const upper = (suffix: string): FrontmatterSchema => ({
			"~standard": {
				version: 1,
				vendor: "test",
				validate: (value) => ({
					value: {
						...(value as object),
						title: `${(value as { title: string }).title}${suffix}`,
					},
				}),
			},
		});
		pipeline.registerCollection({ name: "c", dir, frontmatter: upper("!") });
		expect((await pipeline.meta(file, page("A"), "c")).title).toBe("A!");
		pipeline.registerCollection({ name: "c", dir, frontmatter: upper("?") });
		expect((await pipeline.meta(file, page("A"), "c")).title).toBe("A?");
	});
});
