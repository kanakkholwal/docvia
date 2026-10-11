---
"@docvia/core": major
"@docvia/build": major
"@docvia/cli": major
"@docvia/search": major
"@docvia/plugin-shiki": major
"@docvia/plugin-mermaid": major
"@docvia/plugin-openapi": major
---

docvia is now seven packages instead of eighteen.

- `@docvia/core` holds everything that runs where docs are served, with no Node APIs, so it runs on Cloudflare Workers and in browsers. It absorbs `@docvia/ir`, `@docvia/schema`, the plugin API from `@docvia/plugins`, `@docvia/renderer-core`, `@docvia/source`, `@docvia/ssr`, `@docvia/renderer-react` and `@docvia/renderer-svelte` as subpaths. React and Svelte are optional peers.
- `@docvia/build` holds the Node build tooling: `@docvia/runtime`, `@docvia/compiler`, config loading from `@docvia/plugins`, `@docvia/plugin-vite` (now `@docvia/build/vite`) and `@docvia/plugin-next` (now `@docvia/build/next`). `@docvia/core` is its peer dependency.
- `markdownToIR`, the pipeline every mode shares, is now exported from `@docvia/core/markdown`.
- `docvia init` installs `@docvia/core` and `@docvia/search`, plus `@docvia/build` and `@docvia/plugin-shiki` as dev dependencies.

Imports move like this:

| Before | After |
|---|---|
| `@docvia/ir`, `@docvia/plugins` (`defineConfig`, `PluginRunner`) | `@docvia/core` |
| `@docvia/core` (`parseMarkdown`) | `@docvia/core/markdown` |
| `@docvia/schema` | `@docvia/core/schema` |
| `@docvia/renderer-core` | `@docvia/core/render` |
| `@docvia/source`, `@docvia/source/macro` | `@docvia/core/source`, `@docvia/core/source/macro` |
| `@docvia/ssr` | `@docvia/core/ssr` |
| `@docvia/renderer-react`, `@docvia/renderer-svelte` | `@docvia/core/react`, `@docvia/core/svelte` |
| `@docvia/renderer-svelte/node` | `@docvia/core/svelte/node` |
| `@docvia/runtime`, `@docvia/compiler`, `@docvia/plugins` (`loadConfig`, `resolveProject`) | `@docvia/build` |
| `@docvia/plugin-vite` | `@docvia/build/vite` |
| `@docvia/plugin-next` | `@docvia/build/next` |
