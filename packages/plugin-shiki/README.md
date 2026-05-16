# @docvia/plugin-shiki

Build-time syntax highlighting for docvia, powered by [Shiki](https://shiki.style).

It registers as a docvia plugin. During compilation its `beforeRender` hook
walks the document IR, highlights every fenced code block, and embeds the
resulting HTML on the node. Because highlighting happens at build time, no
syntax highlighter ships to the runtime or edge bundle — the renderer just
emits the pre-highlighted markup.

```ts
// docvia.config.ts
import { defineConfig } from "@docvia/cli";
import { shiki } from "@docvia/plugin-shiki";

export default defineConfig({
  plugins: [shiki({ theme: "github-dark" })],
});
```

Highlighting is pluggable: any highlighter can be wired the same way (a docvia
plugin whose `beforeRender` populates `props.html` on `code-block` nodes), so
projects that need a smaller footprint can swap Shiki for a lighter library.
