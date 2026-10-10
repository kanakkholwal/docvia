---
"@docvia/core": major
"@docvia/cli": patch
---

React and Svelte share one renderer API: `Renderer` with `nodes`, `registry` and `components`.

- `DocviaContent` from `@docvia/core/react` is now `Renderer`, the name Svelte already used. `DocviaContentProps` is `RendererProps` and `DocviaComponents` is `RendererComponents`.
- The Svelte `Renderer` takes `components` too: tag overrides (`{ a: Link }`) and a `codeBlock` slot, with the same props as React.
- `codeBlock` overrides now reach code blocks at any depth, such as inside lists; before, React only saw top-level ones and Svelte none.
- The Svelte renderer keeps `a` and `img` as nodes, like React, so tag overrides work the same in both.
- `staticHtml.keepTags` adds to the renderer's own kept tags instead of replacing them.
- A missing directive component renders the same `docvia-render-error` placeholder in both.
- `docvia init` templates use `Renderer`.
