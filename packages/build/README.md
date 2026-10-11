# @docvia/build

docvia's build tooling for Node: the compiler, the page pipeline, config loading, and the Vite and Next.js plugins.

```bash
pnpm add -D @docvia/build
```

| Import | Contents |
|---|---|
| `@docvia/build` | `CompileService`, `PagePipeline`, `compile()`, `loadConfig`, `resolveProject` |
| `@docvia/build/vite` | The `docvia()` Vite plugin |
| `@docvia/build/next` | `withDocvia()` for Next.js (webpack and Turbopack) |

`@docvia/core` is a peer dependency: the code these plugins generate imports it from your app.

Docs: https://docvia.dev/docs/packages/build
