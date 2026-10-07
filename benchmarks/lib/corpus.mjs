import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Slug of the page each run edits; it exists at every corpus size. */
export const EDIT_SLUG = "section-5/page-5";
/** Text present in the edited page before the edit, used to place the marker. */
export const EDIT_ANCHOR = "## Usage";

function page(i, count, docsPath) {
	const next = (i + 1) % count;
	return `---
title: Page ${i}
description: Benchmark page number ${i}.
---

## Overview

This page ${i} explains a feature with **bold**, _emphasis_ and \`inline code\`. It links to [another page](${docsPath}/section-${next % 10}/page-${next}).

- First point about page ${i}
- Second point with more words to make the paragraph realistic
- Third point

## Usage

\`\`\`ts
import { feature${i} } from "./lib";

export function run(input: string): number {
	const value = feature${i}(input.trim());
	return value.length * ${i};
}
\`\`\`

\`\`\`bash
npm install feature-${i}
npx feature-${i} --watch
\`\`\`

## Options

| Option | Type | Default |
| --- | --- | --- |
| \`enabled\` | \`boolean\` | \`true\` |
| \`depth\` | \`number\` | \`${i % 7}\` |

### Notes

A closing paragraph for page ${i} with enough text to resemble real documentation content, describing edge cases and caveats.
`;
}

/**
 * File for `slug` (no extension; "" is the index page). "files" layout is `slug.md`; "routes" is
 * SvelteKit-style `slug/+page.md`, for stacks whose pages are routes.
 */
export function pageFile(slug, { ext = ".md", layout = "files" } = {}) {
	if (layout === "routes") return join(slug, `+page${ext}`);
	return `${slug || "index"}${ext}`;
}

/**
 * Replaces `dir` with `count` plain Markdown pages in ten sections, plus an index page. `ext` is
 * `.mdx` for stacks whose starters only pick up MDX; the content is valid as both.
 */
export function writeCorpus(
	dir,
	count,
	{ ext = ".md", layout = "files", docsPath = "/docs" } = {},
) {
	rmSync(dir, { recursive: true, force: true });
	const write = (slug, body) => {
		const file = join(dir, pageFile(slug, { ext, layout }));
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, body);
	};
	write(
		"",
		"---\ntitle: Benchmark docs\ndescription: Generated corpus.\n---\n\nThe benchmark corpus.\n",
	);
	for (let i = 0; i < count; i++) {
		write(`section-${i % 10}/page-${i}`, page(i, count, docsPath));
	}
}

/** Contents of a page added during the dev run. */
export function addedPage(marker) {
	return `---\ntitle: Added page\ndescription: Added while the dev server runs.\n---\n\n${marker}\n`;
}
