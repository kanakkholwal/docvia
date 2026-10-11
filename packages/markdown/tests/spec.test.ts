import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toHtml } from "../src/index";

interface Example {
	markdown: string;
	html: string;
	example: number;
	section: string;
}

const examples: Example[] = JSON.parse(
	readFileSync(
		join(import.meta.dirname, "fixtures", "commonmark-0.31.2.json"),
		"utf8",
	),
);

// Plain CommonMark: the spec expects raw HTML through and URLs untouched.
export const render = (markdown: string) =>
	toHtml(markdown, {
		html: true,
		gfm: false,
		directives: false,
		urlTransform: (u) => u,
	});

/** 651: only #25 fails, which needs the full ~2,100-name entity table; the size cost is not worth it. */
const MIN_PASSING = 651;

describe("CommonMark 0.31.2 spec", () => {
	it(`passes at least ${MIN_PASSING} of ${examples.length} examples`, () => {
		const passed = examples.filter((e) => {
			try {
				return render(e.markdown) === e.html;
			} catch {
				return false;
			}
		}).length;
		console.log(`CommonMark: ${passed}/${examples.length}`);
		expect(passed).toBeGreaterThanOrEqual(MIN_PASSING);
	});
});
