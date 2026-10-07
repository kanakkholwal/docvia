---
"@docvia/plugin-next": patch
"@docvia/runtime": patch
---

Faster page edits in Next.js dev on large docs.

- `PagePipeline.meta()` caches frontmatter by content hash and schema, so a rescan parses only files that changed.
- The Next.js `defineDocs()` loader keeps one pipeline for the process and evaluates `lib/source.ts` once per distinct source, instead of rebuilding both on every page edit.
