---
"@docvia/core": minor
---

Absolute `http(s)` links in Markdown now open in a new tab with `rel="noopener noreferrer"`. Set `externalLinks: false` on `createReactRenderer()` or `createSvelteRenderer()` to keep plain links, or pass your own `target` and `rel`.
