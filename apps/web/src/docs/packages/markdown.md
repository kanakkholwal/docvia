---
title: "@docvia/markdown"
description: "A small, dependency-free CommonMark + GFM renderer with streaming for AI output. Works in any app, with or without docvia."
eyebrow: "Packages"
order: 30
---

`@docvia/markdown` renders Markdown at runtime: comments, CMS content, a live editor, or an AI answer
arriving token by token. It has no dependencies and no tie to the rest of docvia, so any app can use it.
It reads the same syntax as docvia docs (directives, code fence meta) and renders components the same
way, so content looks the same in both.

::markdown-playground

## Install

```bash
npm install @docvia/markdown
```

| Import | Contents |
|---|---|
| `@docvia/markdown` | `parse`, `toHtml`, `renderBlocks`, `createMarkdownStream`, `repair`, and the AST types. |
| `@docvia/markdown/dom` | `renderMarkdown` and `createStreamRenderer`, with word animations. No framework. |
| `@docvia/markdown/react` | `<Markdown>`, `<StreamingMarkdown>`, `useMarkdownStream`. React is an optional peer. |
| `@docvia/markdown/svelte` | `<Markdown>` and `<StreamingMarkdown>` for Svelte 5. Svelte is an optional peer. |

## Size and correctness

| Entry | Minified | Minified + gzip |
|---|---|---|
| `parse` + `toHtml` | 20 KB | 8.5 KB |
| everything in `.`, with streaming | 25 KB | 10.6 KB |
| `./dom` with animations | 26.5 KB | 11.2 KB |

It passes 651 of the 652 examples in the CommonMark 0.31.2 spec, checked in CI. The one it fails needs
the full table of about 2,100 named HTML entities, which would double the size; the common ones
(`&amp;`, `&copy;`, `&mdash;`, accented letters) and every numeric reference work. On top of CommonMark
it supports GitHub's tables, task lists, strikethrough and bare URLs.

The parser is a port of [commonmark.js](https://github.com/commonmark/commonmark.js), the spec
authors' reference implementation, rather than a new design; see `THIRD_PARTY_NOTICES.md` in the
package.

## Render once

```ts
import { toHtml } from "@docvia/markdown";

const html = toHtml(markdown, {
  // Optional: highlighted HTML for a code block, or undefined for plain.
  highlight: (code, lang, meta) => undefined,
  // Optional: render docvia directives like :::callout{type=tip}.
  directiveComponents: {
    callout: ({ attributes, children }) => `<aside class="callout ${attributes.type}">${children}</aside>`,
  },
});
```

`parse(markdown)` returns the tree instead, for your own renderer.

| Option | Default | Description |
|---|---|---|
| `html` | `false` | Keep raw HTML. Off, tags are escaped and shown as text. |
| `gfm` | `true` | Tables, task lists, strikethrough and bare URLs. |
| `directives` | `true` | `:::name{attrs}` blocks, `::name{attrs}` leaves and `:name[label]` inline. |
| `urlTransform` | safe protocols only | Rewrites or rejects each URL. The default keeps `http`, `https`, `mailto`, `tel`, `irc`, `xmpp` and relative URLs, and empties the rest, as react-markdown does. |
| `highlight` | none | Returns highlighted HTML for a code block. |
| `directiveComponents` | none | Renders directives by name; others become `<div data-directive="name">`. |

## Stream AI output

A stream parses each finished block once and freezes it. Only the text after the last finished block
is parsed again when a chunk arrives, so a long answer costs about the same per chunk as a short one.

```ts
import { createMarkdownStream } from "@docvia/markdown";

const stream = createMarkdownStream();
for await (const chunk of response) {
  const blocks = stream.push(chunk); // [{ key, node, done }]
}
stream.end();
```

- **Stable keys.** A block keeps its `key` from its first appearance, so a framework can patch it in place.
- **Repair.** While streaming, the tail is shown as it will look when complete: `**bold`, `*italic`, `~~strike`
  and an open code span are closed, `[text](https://exa` shows as `text`, a half-written image or entity
  is held back, and a table appears once its delimiter row is complete. `end()` parses the text exactly as
  written.
- **Reference links** defined after their first use resolve when the stream ends.

### In the DOM

```ts
import { createStreamRenderer } from "@docvia/markdown/dom";

const view = createStreamRenderer(document.querySelector("#answer"), {
  animate: { effect: "blur", duration: 240, stagger: 18 },
  caret: true,
});
for await (const chunk of response) view.push(chunk);
view.end();
```

Only blocks whose HTML changed are rewritten, the container eases to its new height, and a caret
follows the last word. People who prefer reduced motion see none of it.

### Animation options

The DOM, React and Svelte renderers take the same `animate` object (`true` means the defaults):

| Option | Default | |
| --- | --- | --- |
| `effect` | `"fade"` | `"fade"`, `"blur"`, `"rise"`, `"settle"`, `"wipe"`, or the name of your own `@keyframes`. |
| `duration` | `240` | Milliseconds for a word to enter. |
| `stagger` | `18` | Delay between new words in one update, capped at 400 ms. |
| `easing` | `"ease-out"` | Any CSS easing for the enter animation. |
| `layout` | `true` | Words that move when a line rewraps glide to their new place; a number sets the milliseconds (180). |

A custom effect is plain CSS. Words are relatively positioned inline spans, so animate `top` and `left`
rather than `transform`:

```css
@keyframes pop {
  from { opacity: 0; top: -0.6em; }
}
```

```ts
createStreamRenderer(el, { animate: { effect: "pop", duration: 320 } });
```

### In React and Svelte

```tsx
import { StreamingMarkdown } from "@docvia/markdown/react";

<StreamingMarkdown streaming={!done} animate={{ effect: "settle" }} directiveComponents={{ callout: Callout }}>
  {text}
</StreamingMarkdown>;
```

```svelte
<script>
  import { StreamingMarkdown } from "@docvia/markdown/svelte";
</script>

<StreamingMarkdown source={text} streaming={!done} animate={{ effect: "settle" }} />
```

Pass the whole text so far on every update; the component pushes only what was appended, and starts
over if the text changes in any other way. Finished blocks are skipped on re-render, and words animate
only when they first appear. `<Markdown>` renders a complete string without streaming. In React,
`components` replaces any HTML tag, as in react-markdown.

## Safety

Raw HTML is escaped unless you pass `html: true`, and URLs go through `urlTransform`, which drops
`javascript:`, `data:` and other unknown protocols by default. The React and Svelte renderers build
elements rather than setting `innerHTML`, except for raw HTML when `html` is on.
