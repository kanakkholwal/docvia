# @docvia/core

Everything in docvia that runs where your docs are served: Cloudflare Workers, browsers and Node. No Node APIs.

```bash
pnpm add @docvia/core
```

| Import | Contents |
|---|---|
| `@docvia/core` | IR and config types, `docviaError`, the plugin API (`defineConfig`, `PluginRunner`) |
| `@docvia/core/markdown` | `parseMarkdown`, `markdownToIR` |
| `@docvia/core/schema` | Frontmatter extraction and validation |
| `@docvia/core/render` | The rendering engine; `/render/client` for copy buttons and code tabs |
| `@docvia/core/source` | `loader()`, the page tree; `/source/macro` for `defineDocs()` |
| `@docvia/core/ssr` | Request-time rendering |
| `@docvia/core/react` | React bindings (React is an optional peer) |
| `@docvia/core/svelte` | Svelte bindings (Svelte is an optional peer) |

Build tooling (compiler, config loading, Vite and Next.js plugins) is in `@docvia/build`.

Docs: https://docvia.dev/docs/packages/core
