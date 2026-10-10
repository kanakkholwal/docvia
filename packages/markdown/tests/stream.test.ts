import { describe, expect, it } from "vitest";
import {
	createMarkdownStream,
	renderBlocks,
	repair,
	toHtml,
} from "../src/index";

const DOC = `# Streaming answer

Here is **bold**, *italic* and \`code\`, plus a [link](https://example.com).

- first item
- second item with ~~old~~ text

1. one
2. two

> A quote
> over two lines

\`\`\`ts title="x.ts"
const x = 1;

const y = 2;
\`\`\`

| Name | Value |
| --- | ---: |
| a | 1 |
| b | 2 |

:::callout{type=tip}
Inside a **directive**.
:::

## Second heading

Final paragraph with [a ref][r].

[r]: https://example.com/ref
`;

function chunks(text: string, size: number): string[] {
	const out: string[] = [];
	for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
	return out;
}

describe("createMarkdownStream", () => {
	for (const size of [1, 3, 7, 64]) {
		it(`ends identical to a one-shot render with ${size}-character chunks`, () => {
			const stream = createMarkdownStream();
			const frozen = new Map<string, string>();
			for (const chunk of chunks(DOC, size)) {
				for (const block of stream.push(chunk)) {
					const html = renderBlocks([block.node]);
					if (!block.done) continue;
					// A frozen block never changes afterwards.
					if (frozen.has(block.key)) expect(html).toBe(frozen.get(block.key));
					else frozen.set(block.key, html);
				}
			}
			const final = stream.end();
			expect(renderBlocks(final.map((b) => b.node))).toBe(toHtml(DOC));
			expect(final.every((b) => b.done)).toBe(true);
			expect(frozen.size).toBeGreaterThan(5);
		});
	}

	it("keeps each block's key from its first appearance", () => {
		const stream = createMarkdownStream();
		stream.push("# Title\n\nFirst para");
		const before = stream.blocks.map((b) => b.key);
		stream.push("graph continues.\n\nSecond para");
		expect(stream.blocks.map((b) => b.key).slice(0, 2)).toEqual(before);
	});

	it("shows half-written syntax as it will look once complete", () => {
		const html = (md: string) =>
			renderBlocks(
				createMarkdownStream()
					.push(md)
					.map((b) => b.node),
			);
		expect(html("Some **bold te")).toBe(
			"<p>Some <strong>bold te</strong></p>\n",
		);
		expect(html("A `code sp")).toBe("<p>A <code>code sp</code></p>\n");
		expect(html("See [the docs](https://exa")).toBe("<p>See the docs</p>\n");
		expect(html("An image ![alt](https://x")).toBe("<p>An image</p>\n");
		expect(html("```js\nconst a")).toBe(
			'<pre><code class="language-js">const a\n</code></pre>\n',
		);
		expect(html("Before\n\n| a | b |")).toBe("<p>Before</p>\n");
	});
});

describe("repair", () => {
	it("closes nested emphasis innermost first and ignores word-internal underscores", () => {
		expect(repair("**bold *it")).toBe("**bold *it***");
		expect(repair("snake_case and _em")).toBe("snake_case and _em_");
		expect(repair("~~gone")).toBe("~~gone~~");
		expect(repair("* list item")).toBe("* list item");
		expect(repair("done **already**")).toBe("done **already**");
	});
});
