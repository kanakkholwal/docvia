# @docvia/markdown

Markdown for any app: a small, dependency-free CommonMark + GFM parser and renderer, with streaming for
AI output. Works in browsers, Cloudflare Workers and Node; React and Svelte bindings included.

```bash
npm install @docvia/markdown
```

- **Small:** about 20 KB minified (8.5 KB gzipped) for parsing and HTML. No dependencies.
- **Correct:** passes 651 of the 652 CommonMark 0.31.2 spec examples, plus GFM tables, task lists,
  strikethrough and bare URLs.
- **Safe by default:** raw HTML is escaped and `javascript:` style URLs are dropped.
- **Streaming:** finished blocks are parsed once; only the tail re-parses, with half-written syntax
  repaired so `**bold` renders bold before its closing marker arrives.

```ts
import { toHtml } from "@docvia/markdown";

toHtml("# Hello **world**");
```

```ts
import { createStreamRenderer } from "@docvia/markdown/dom";

const view = createStreamRenderer(document.querySelector("#answer")!, {
  animate: { effect: "settle", layout: true }, // fade, blur, rise, settle, wipe or your @keyframes
});
for await (const chunk of response) view.push(chunk);
view.end();
```

```tsx
import { StreamingMarkdown } from "@docvia/markdown/react";

<StreamingMarkdown streaming={!done}>{text}</StreamingMarkdown>;
```

Docs and live demo: https://docvia.dev/docs/packages/markdown
