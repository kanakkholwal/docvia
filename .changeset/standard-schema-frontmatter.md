---
"@docvia/schema": minor
"@docvia/ir": minor
"@docvia/plugins": minor
"@docvia/runtime": minor
"@docvia/plugin-vite": minor
"@docvia/plugin-next": minor
"@docvia/cli": minor
"@docvia/search": minor
"@docvia/renderer-react": patch
"@docvia/renderer-svelte": patch
"@docvia/ssr": patch
---

Standard Schema frontmatter validation, precise type inference, and unified internals

Frontmatter validation is now **validation-library agnostic** via the
[Standard Schema](https://standardschema.dev) spec. Pass any compliant schema —
Zod, Valibot, ArkType, … — as `frontmatter` in your config, not just Zod:

```ts
import * as v from "valibot";
export default defineConfig({
  frontmatter: v.object({ author: v.optional(v.string()) }),
});
```

- **Precise generated types for any library.** The generated `Frontmatter` type
  is inferred from the schema's compile-time `~standard.types` output, so it
  stays exact whatever library you use — with no runtime introspection. The base
  fields, the inference formula, and the composition now live in `@docvia/schema`
  (`BASE_FRONTMATTER_TYPE`, `inferSchemaOutput`, `composeFrontmatterType`).
- **Zero-config type inference.** `defineConfig` is generic and preserves your
  schema's concrete type, and every entry point auto-detects `docvia.config.*`
  across `.ts/.mts/.cts/.js/.mjs/.cjs`. In the Vite plugin, pass `{ configPath }`
  to point elsewhere or `{ configPath: false }` to opt out.
- **New public APIs.** `@docvia/plugins`: `resolveProject`, `resolveConfigPath`,
  `CONFIG_BASENAMES`. `@docvia/ir`: `toPageMeta`, `InferFrontmatter`,
  `FrontmatterSchema`, and `configPath` on `CompilerOptions`.

Internals were consolidated behind these features with no behavior change
(generated `.docvia` output is byte-identical): build, dev, and every bundler
loader now share one markdown→IR pipeline (`markdownToIR`); config discovery +
load + project-root derivation flow through one resolver (`resolveProject`); the
frontmatter→`PageMeta` mapping is owned by `toPageMeta`; and the disk
`source.ts`/`browser.ts` emitters share their collection bindings.

Note: `@docvia/schema` no longer exports the Zod-specific `zodSchemaToFrontmatterTs`
type-codegen helper — frontmatter types are now derived from the schema's
Standard Schema output type instead of Zod introspection.
