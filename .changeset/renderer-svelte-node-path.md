---
"@docvia/renderer-svelte": patch
---

Fix `node:path` leaking into the browser bundle. The package root entry (`@docvia/renderer-svelte`) re-exported the build-time adapter, which imports `@docvia/ir` and therefore `node:path` — crashing client hydration with "Module 'node:path' has been externalized for browser compatibility." The root now exports only the `Renderer` component; the build-time adapter is unchanged and still available from `@docvia/renderer-svelte/node`.
