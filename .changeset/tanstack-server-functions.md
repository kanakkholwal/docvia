---
"@docvia/cli": patch
---

`docvia init` for TanStack Start loads the page tree and page bodies through server functions.

Route loaders run in the browser too, so importing `lib/source.ts` in them shipped every page's frontmatter and a lazy chunk per page body to the client. Measured on a fresh app: page JS stays at 111 KB from 300 to 1500 pages (was 119 to 148 KB), and the browser build drops from 2.2 MB to 113 KB at 1500 pages.
