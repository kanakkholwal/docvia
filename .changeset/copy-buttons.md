---
"@docvia/renderer-core": minor
"@docvia/renderer-react": minor
"@docvia/renderer-svelte": minor
"@docvia/cli": patch
---

Code blocks get a copy button.

- Every code block now carries `data-docvia-code` and ends with a `<button class="docvia-copy" data-docvia-copy>` (exported as `COPY_BUTTON_HTML`). Style or hide it with CSS.
- `installCopyButtons()` from `@docvia/renderer-core/client` wires every button with one delegated listener: it copies the block's code and sets `data-copied` for 1.6 s. Svelte's `<Renderer>` and React's `hydrate()` call it for you; `@docvia/renderer-react/client` re-exports it.
- React's `codeBlock` override still receives the highlighted HTML without the built-in button, so custom blocks keep their own controls.
- The CLI's React template calls `installCopyButtons()` and its `docs.css` styles the button.
