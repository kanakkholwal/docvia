# @docvia/docs

The documentation site for docvia — and a working example of docvia itself.
Every page is a Markdown file under [`src/docs/`](./src/docs), compiled by
`@docvia/compiler` and rendered with `@docvia/renderer-svelte`. The site
dogfoods the compiler.

- **Stack**: SvelteKit + Svelte 5 (runes) + TypeScript
- **Content**: Markdown in `src/docs/`, compiled by docvia
- **Styling**: Tailwind CSS v4 + design tokens from [DESIGN.md](../../DESIGN.md)

## How it works

The docs site is wired up exactly like the SvelteKit integration described in
the [Framework integration](./src/docs/guide/frameworks.md) guide:

- [`docvia.config.ts`](./docvia.config.ts) — sources `src/docs`, renders with
  the Svelte renderer, outputs the module graph to `.docvia/`.
- [`vite.config.ts`](./vite.config.ts) — adds `docviaSourcePlugin()` and
  `docviaMarkdownPlugin()` alongside `sveltekit()` and `tailwindcss()`.
- `predev` / `prebuild` scripts run `docvia build` before Vite starts.
- [`src/routes/[...slug]/`](./src/routes) — a catch-all route loads each page
  from `docvia/source` and renders it with the `Renderer` component.
- The sidebar is generated from `docs.pageTree` — see
  [`+layout.server.ts`](./src/routes/+layout.server.ts).

## Editing the docs

Add or edit a Markdown file under `src/docs/`:

- `src/docs/*.md` — top-level pages.
- `src/docs/guide/*.md` — task-oriented guides.
- `src/docs/packages/*.md` — per-package API reference.

Each file needs frontmatter with at least a `title`. `order` controls sidebar
position; `eyebrow` sets the section label shown above the page title. A folder
with an `index.md` becomes a sidebar section.

## Development

```bash
pnpm install
pnpm --filter @docvia/docs dev     # runs `docvia build`, then `vite dev`
```

The dev server runs on http://localhost:5173. Editing a Markdown file
hot-reloads through `docviaMarkdownPlugin`.

```bash
pnpm --filter @docvia/docs build   # docvia build + vite build
```
