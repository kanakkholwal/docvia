---
title: Writing pages
description: The Markdown features available out of the box.
---

Pages are compiled at build time: syntax highlighting, headings and search data
are baked in, so nothing parses Markdown in the browser.

## Code blocks

Add a title after the language:

```ts title="greet.ts"
export function greet(name: string): string {
  return `Hello, ${name}`;
}
```

Install commands get a tab per package manager:

```npm
npm install zod
```

Group related snippets into tabs:

:::code-group

```ts tab="Server"
export const runtime = "server";
```

```ts tab="Client"
export const runtime = "client";
```

:::

## Tables

| Feature | Where it runs |
| --- | --- |
| Highlighting | build time |
| Search index | build time |
| Rendering | your framework |

> Quotes, lists, images and links work as plain Markdown.
