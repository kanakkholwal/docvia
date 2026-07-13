---
"@docvia/renderer-react": patch
---

Fix the `hydrate()` JSDoc example, which imported an unresolvable per-page virtual
module (`virtual:docvia/my-page`) and then also took the same `manifest` as a
prop. The manifest comes off a page loaded on the server and is passed in — a
client component must not import the collection, which eagerly pulls in every
compiled page.
