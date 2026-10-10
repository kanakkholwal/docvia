---
"@docvia/cli": patch
"@docvia/search": patch
"@docvia/build": patch
---

`docvia init` works with npm, pnpm, yarn and bun alike, checked by creating and building Next.js, SvelteKit and TanStack Start apps with each.

- `init` exits with code 1 when installing fails, instead of reporting success.
- With `DOCVIA_TARBALLS`, yarn pins tarballs through `resolutions`, and npm no longer hits `EOVERRIDE` for directly installed packages.
- `@docvia/search` no longer installs `@docvia/build`: it is an optional peer, needed only by `@docvia/search/node`.
- On SvelteKit 3, which dropped the `$lib` alias, `init` writes relative imports unless the app declares `#lib/*` in package.json `imports`.
- The "No renderer found" error names `createReactRenderer()` and `createSvelteRenderer()` instead of the retired renderer packages.
