---
"@docvia/plugin-vite": patch
"@docvia/source": patch
---

Editing a page body in dev swaps just that page on the server instead of reloading every server module.

- Fixes `Cannot read properties of null (reading 'function')` thrown by SvelteKit layouts after each content edit: the full SSR program reload re-ran Svelte's runtime under the running app.
- Compiled pages accept their own hot updates in dev, and `page.data.load()` caches by module rather than by path, so the server serves the new body at once. The browser reloads to show it.
- A visible edit in a fresh SvelteKit app drops from about 250 ms to 56 ms.
