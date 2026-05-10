# @docvia/docs

Documentation site for docvia.

- **Stack**: SvelteKit + Svelte 5 (runes) + TypeScript
- **Styling**: Tailwind CSS v4 + design tokens from [DESIGN.md](../../DESIGN.md)
- **Components**: shadcn-svelte–style vendored primitives (kept in sync with `@docvia/web`)

## Development

```bash
pnpm install
pnpm --filter @docvia/docs dev
```

The dev server runs on http://localhost:5173.

## Status

This is the v0.1 starter shell. The "soon" pages in the sidebar will be filled
in as the documentation grows. A future iteration will compile the prose
directly through docvia (so the docs site dogfoods the compiler).
