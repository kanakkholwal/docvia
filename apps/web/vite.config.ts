import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { docvia } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

// `yaml` (a transitive dep via @docvia/schema) resolves to its CommonJS build
// under the SSR `node` condition. Vite 8 / Rolldown wraps CJS modules with
// `createRequire(import.meta.url)`, but `import.meta.url` is `undefined` in the
// Cloudflare Workers runtime, crashing the worker on startup. yaml ships a
// pure-ESM build at `browser/index.js` (same API, no `require`); alias to it so
// nothing CJS gets bundled. The subpath isn't in yaml's `exports` map, so we
// resolve it via the package directory rather than a bare specifier.
const require = createRequire(import.meta.url);
const yamlEsm = join(
	dirname(require.resolve("yaml/package.json")),
	"browser/index.js",
);

export default defineConfig({
	resolve: {
		alias: {
			yaml: yamlEsm,
		},
	},
	// `docvia()` runs the CompileService in-process — no separate `docvia build`
	// step, a virtual `docvia/source` module in dev, and incremental HMR.
	plugins: [tailwindcss(), sveltekit(), docvia(docviaConfig)],
});
