# @docvia/web

Marketing / landing site for docvia.

- **Stack**: SvelteKit + Svelte 5 (runes) + TypeScript
- **Styling**: Tailwind CSS v4 + design tokens from [DESIGN.md](../../DESIGN.md)
- **Components**: shadcn-svelte–style vendored primitives in `src/lib/components/ui/`

## Development

```bash
pnpm install
pnpm --filter @docvia/web dev
```

The dev server runs on http://localhost:5173.

## Build

```bash
pnpm --filter @docvia/web build
pnpm --filter @docvia/web preview
```

## Notes

This is a starter scaffold — content beyond the landing page should land in
follow-up work.
