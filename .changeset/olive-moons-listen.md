---
"@docvia/source": minor
---

Fix collections returning empty frontmatter and slug-derived nav labels on first read

`createCollection` awaited `getEagerModules()` unconditionally. On the server that
value is available **synchronously**, so the `await` deferred a microtask and
handed the first caller nothing — with no error to explain it:

- the first `getPages()` returned `data: {}` for every page;
- `pageTree` fell back to title-casing the slug, so navigation rendered wrong
  labels, and `getOrder` returned `Infinity`, so the tree silently sorted
  alphabetically instead of by frontmatter `order`;
- worse, `pageTree` is memoized — a tree built while the cache was cold stayed
  wrong for the life of the process.

Changes:

- `getEagerModules` may now return the module map directly. A non-thenable is
  adopted synchronously, so on the server `getPages()` and `pageTree` are correct
  on the very first read.
- The memoized page tree is invalidated when metadata lands, so a cold-built tree
  is rebuilt rather than cached forever.
- New `docviaCollection.ready(): Promise<void>` — the supported way to await
  metadata on the browser build, where it genuinely cannot be resolved
  synchronously. It resolves immediately on the server, so universal code can
  always await it.
- Reading `getPages()` / `pageTree` before metadata resolves now logs a one-time
  warning instead of silently returning fallback data.
- A rejected dynamic import no longer surfaces as an unhandled rejection.

`getPage()` was never affected — it awaits the page module either way.
