---
title: Introduction
description: Your documentation starts here.
---

This page is `content/docs/index.md`. Edit it while the dev server runs and the
page updates in place.

## Add a page

Create a Markdown file anywhere under `content/docs/`. Its path becomes its URL:
`content/docs/guides/writing.md` is served at `/docs/guides/writing`.

```md title="content/docs/guides/deploy.md"
---
title: Deploy
description: Ship the docs with the rest of the app.
---

Write Markdown here.
```

## Order the sidebar

A `meta.json` in any folder sets its title and page order:

```json title="content/docs/guides/meta.json"
{ "title": "Guides", "pages": ["writing", "..."] }
```

## Search

Every page is indexed at build time. Query it from the client:

```bash
curl "http://localhost:3000/api/search?query=sidebar"
```
