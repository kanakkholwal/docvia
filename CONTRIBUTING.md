# Contributing to docvia

Thanks for your interest in docvia. This guide covers getting the monorepo
running locally, the watch modes, and how releases work.

## Getting started

docvia is a pnpm + Turborepo monorepo. You need Node 18+ and pnpm.

```bash
pnpm install
pnpm build       # build all packages
pnpm test        # run vitest across packages
pnpm typecheck   # tsc --noEmit across packages
```

Run `pnpm build` once after cloning — most packages depend on the compiled
output of others, so tests and the dev servers expect it to exist.

## Repo layout

| Path | What it is |
|---|---|
| `packages/*` | The published `@docvia/*` packages (compiler, CLI, renderers, plugins). |
| `apps/web` | Marketing/landing site (SvelteKit + Tailwind + shadcn-svelte). |
| `apps/docs` | Documentation site (SvelteKit + docvia). |
| `examples/demo-next` | End-to-end React/Next.js example. |
| `examples/demo-svelte` | End-to-end Svelte/SvelteKit example. |

## Watch modes

`pnpm dev` is intentionally focused — it only watches `packages/*` and
`apps/*`, not the heavier `examples/*` demos. Run those explicitly when you
need them.

| Script | What it watches |
|---|---|
| `pnpm dev` | All packages + both apps (`apps/web`, `apps/docs`) |
| `pnpm dev:packages` | Only `packages/*` (compiler, CLI, renderers, …) |
| `pnpm dev:apps` | Only `apps/*` (landing + docs site) |
| `pnpm dev:web` | Only `apps/web` |
| `pnpm dev:docs` | Only `apps/docs` |
| `pnpm dev:examples` | Both example demos (`demo-next`, `demo-svelte`) |
| `pnpm dev:next` | Only `examples/demo-next` |
| `pnpm dev:svelte` | Only `examples/demo-svelte` |
| `pnpm dev:all` | Everything in the monorepo |

Each filtered script still rebuilds the packages it depends on (`turbo`
resolves the dependency graph), so you can run `pnpm dev:next` without first
running `pnpm dev:packages`.

## Releases

Releases are managed with [Changesets](https://github.com/changesets/changesets).
See [RELEASING.md](./RELEASING.md) for the full workflow.

```bash
pnpm changeset           # author a changeset (run on every code-changing PR)
pnpm changeset:status    # see what's pending
pnpm version-packages    # consume changesets → bump versions, write CHANGELOGs
pnpm release             # pnpm build && changeset publish
```

CI handles version bumps and publishing automatically — see
`.github/workflows/release.yml`.

## Opening a pull request

- Run a changeset on every PR that touches package code (`pnpm changeset`).
- Make sure `pnpm build`, `pnpm test`, and `pnpm typecheck` all pass.
- Keep changes scoped — smaller PRs are easier to review and land faster.

## Architecture notes

If you're digging into how the compiler works, start with:

- [MODES.md](./MODES.md) — the build / dev / SSR breakdown.
- [DESIGN.md](./DESIGN.md) — design decisions and the IR pipeline.
- [documentation.md](./documentation.md) — architecture notes.
