---
"@docvia/cli": patch
---

The sidebar `docvia init` writes keeps folders closed unless they hold the current page, and a closed folder renders nothing.

The old sidebar rendered every link on every page: at 1500 pages that was 432 KB of HTML per page and about 450 ms of render time per request in Next.js dev, against 55 ms for docvia itself. Next.js gets a small client wrapper (`components/docs-sidebar.tsx`) for the current path; SvelteKit gets `DocsTree.svelte` and `DocsFolder.svelte` beside the docs layout.
