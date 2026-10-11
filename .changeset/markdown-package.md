---
"@docvia/markdown": minor
---

New package: `@docvia/markdown`, a dependency-free Markdown renderer for any app.

- CommonMark + GFM (tables, task lists, strikethrough, bare URLs) and docvia's directives, in about 20 KB minified. Passes 651 of the 652 CommonMark 0.31.2 spec examples.
- Safe by default: raw HTML is escaped and unsafe URLs are dropped.
- Streaming for AI output: finished blocks are parsed once and keep stable keys; the live tail is repaired so half-written syntax renders as it will look.
- Outputs: an HTML string, a framework-free DOM renderer, and React and Svelte bindings.
- One `animate` option across all renderers: fade, blur, rise, settle, wipe or your own `@keyframes`, with stagger, easing, layout motion for rewrapped words, and a caret.
