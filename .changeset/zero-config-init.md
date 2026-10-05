---
"@docvia/cli": major
"@docvia/plugins": minor
"@docvia/plugin-vite": minor
"@docvia/plugin-next": minor
"@docvia/plugin-mermaid": patch
---

`docvia init` adds docs to an existing app, and `docvia.config.ts` is optional.

- `docvia init [dir]` detects Next.js, SvelteKit or TanStack Start, the package manager (lockfile, `packageManager`, user agent) and the app's import aliases. It writes `content/docs`, `lib/source.ts`, docs routes with sidebar and table of contents, a `/api/search` route and starter CSS, adds `docvia()` or `withDocvia()` to the bundler config, excludes `content/` from Tailwind v4 scanning, and installs the packages. New flags: `--yes`, `--no-install`, `--framework`. Breaking: `--renderer` and `--dir` are gone (pass the directory as an argument).
- Without a config file, the renderer is picked from the app's dependencies (Svelte or React) and Shiki is enabled when `@docvia/plugin-shiki` is installed. A config file that omits `renderer` gets the same detection.
- `docvia()` (Vite) and `withDocvia()` (Next.js) no longer require `docvia.config.ts`.
- `DOCVIA_TARBALLS=<dir>` makes `docvia init` install packed tarballs, for trying unreleased builds.
- `@docvia/plugin-mermaid`: fix a type error under `noUncheckedIndexedAccess`.
