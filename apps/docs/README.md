# @docvia/docs-redirect

A redirect-only Cloudflare Worker for `docs.docvia.dev`.

The documentation site used to live here. It now lives at
[`docvia.dev/docs`](https://docvia.dev/docs), served by
[`apps/web`](../web) — Markdown sources are in
[`apps/web/src/docs/`](../web/src/docs).

This worker answers every request with a 301 to the matching path under
`docvia.dev/docs`, so existing links and search results keep working.

```text
docs.docvia.dev/                     → docvia.dev/docs
docs.docvia.dev/getting-started      → docvia.dev/docs/getting-started
docs.docvia.dev/guide/cli?x=1        → docvia.dev/docs/guide/cli?x=1
```

## Deploy

```bash
pnpm --filter @docvia/docs-redirect deploy
```

There is no build step; wrangler bundles [`src/index.ts`](./src/index.ts)
directly.
