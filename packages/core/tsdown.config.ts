import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

// ./svelte is built by svelte-package (see the build script); its entries are added here by hand.
const SVELTE = {
	"./svelte": {
		types: "./dist/svelte/index.d.ts",
		svelte: "./dist/svelte/index.js",
		default: "./dist/svelte/index.js",
	},
	"./svelte/node": {
		types: "./dist/svelte/node.d.ts",
		default: "./dist/svelte/node.js",
	},
};

export default defineConfig(
	packageConfig({
		entry: {
			index: "src/index.ts",
			"markdown/index": "src/markdown/index.ts",
			"schema/index": "src/schema/index.ts",
			"render/index": "src/render/index.ts",
			"render/client": "src/render/client.ts",
			"source/index": "src/source/index.ts",
			"source/internal": "src/source/internal.ts",
			"source/macro": "src/source/macro.ts",
			"source/macro-runtime": "src/source/macro-runtime.ts",
			"source/runtime": "src/source/runtime.ts",
			"ssr/index": "src/ssr/index.ts",
			"react/index": "src/react/index.ts",
			// `client` imports react-dom/client, so it stays out of the SSR entry.
			"react/client": "src/react/client.ts",
		},
		platform: "neutral",
		external: [/^react($|\/)/, /^react-dom($|\/)/, /^svelte($|\/)/],
		exports: {
			bin: false,
			customExports: (exports) => ({ ...exports, ...SVELTE }),
		},
	}),
);
