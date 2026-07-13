---
"@docvia/ir": minor
"@docvia/schema": minor
"@docvia/runtime": minor
---

Custom frontmatter now reaches the runtime, and the generated types no longer lie about it

`toPageMeta` hard-coded eight built-in keys and dropped everything else, so fields
validated by a configured `frontmatter` schema were thrown away before they ever
reached a page module. `getPage().data` had no custom fields while the generated
types insisted it did — which made the `frontmatter` option effectively
non-functional, and made TypeScript confirm a shape the runtime never produced.

- `toPageMeta` now spreads `ir.frontmatter` before applying derived fields, so
  every validated key survives to `meta`. Derived fields (`slug`, `contentHash`,
  `headings`) still win over same-named frontmatter keys.
- `PageMeta` gains an index signature and an explicit `draft`. The built-in
  `draft` flag was validated on every file and then consumed by nothing; it is
  now readable, so pages can be filtered on it.
- Generated frontmatter types are wrapped in a new `Jsonify<T>` projection.
  Page `meta` is emitted through `JSON.stringify`, so a schema that coerces to
  `Date` hands the reader back an ISO **string**. The emitted type now says
  `string` too, and calling `.getTime()` on it fails at compile time rather than
  at runtime.

`@docvia/schema` exports `JSONIFY_TYPE_NAME` / `JSONIFY_TYPE_DECL`, and
`composeFrontmatterType` now wraps its result in that projection.

If your schema coerces to a non-JSON type (`Date` being the common one), the
generated type for that field changes from `Date` to `string`. That is what the
value has always been at runtime; the type was previously wrong.
