---
title: "Incremental builds"
description: "How the content-hash cache decides what to rebuild between runs."
eyebrow: "Guide"
order: 6
---

docvia treats your docs the way a bundler treats source code: it hashes
content and rebuilds only what changed. The first build compiles everything;
every build after that is typically milliseconds for unchanged content.

## The cache file

[`@docvia/compiler`](/docs/packages/compiler) persists a `.docvia.cache.json` file
inside `outDir`. It records, per file, a hash of the raw source, the composite
content hash, the cached page metadata, and the generated route — alongside a
small header describing the build environment.

On the next run the compiler reads this file and decides, file by file,
whether the cached output can be reused.

## The content hash

Each page's content hash is **composite** — it is computed from more than just
the file's text. The inputs are:

| Input | Why it matters |
|---|---|
| File content | The Markdown itself changed. |
| Frontmatter | A metadata change can alter the output. |
| Config hash | A different config can produce different output. |
| Plugin cache keys | A plugin's behavior or input changed. |
| Dependency hashes | A file the page depends on changed. |

Hashing uses `xxh64` rendered in base-36. If every input is identical to the
cached entry, the file is skipped; if any input differs, the page is
recompiled.

## When the whole cache is invalidated

Some changes invalidate every entry at once. The compiler discards the cache
when:

- the cache **version** or **tool version** differs from the current build;
- the **config hash** changed;
- any **plugin cache key** changed.

This is why a plugin that depends on an external input should implement
`cacheKey()` — see [Writing plugins](/docs/guide/plugins). When the OpenAPI plugin's
spec file changes, for example, its cache key changes, and every page that
references the spec is rebuilt.

## Forcing a full rebuild

Pass `--no-cache` to ignore the cache and recompile everything:

```bash
docvia build --no-cache
```

This is rarely needed in normal use — the cache is correct by construction —
but it is a useful escape hatch when debugging a plugin or a renderer.

## In dev and framework integrations

`docvia dev` keeps the cache warm between rebuilds, so editing one Markdown
file recompiles only that file. The Vite and Next.js integrations build with
the cache enabled too, which is what keeps incremental dev rebuilds fast — see
[Framework integration](/docs/guide/frameworks).
