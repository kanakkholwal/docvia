---
"@docvia/plugin-vite": major
"@docvia/plugin-next": major
"@docvia/cli": major
---

**Breaking:** `@docvia/source` is now a peer dependency

The generated module graph (`.docvia/source.ts` and the virtual source module)
imports `@docvia/source/internal`, so the package has to be resolvable from the
**consuming app** — not from the plugin. It was a plain dependency of
`@docvia/plugin-vite`, and `@docvia/plugin-next` / `@docvia/cli` did not declare
it at all. Under pnpm's strict linking the generated import is unresolvable, so
the app's build breaks outright rather than merely failing to type-check.

It is now a `peerDependency` of all three, which makes the requirement explicit
and installs it where the generated code actually needs it.

**Migration.** If your package manager does not install peers automatically, add
`@docvia/source` to your app's dependencies:

```bash
pnpm add @docvia/source
```

Projects that already worked around this by depending on `@docvia/source`
directly need no change.
