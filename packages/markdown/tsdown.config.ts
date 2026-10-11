import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

// ./svelte is built by svelte-package (see the build script); its entry is added here by hand.
const SVELTE = {
	"./svelte": {
		types: "./dist/svelte/index.d.ts",
		svelte: "./dist/svelte/index.js",
		default: "./dist/svelte/index.js",
	},
};

export default defineConfig(
	packageConfig({
		entry: { index: "src/index.ts", dom: "src/dom.ts", react: "src/react.tsx" },
		platform: "neutral",
		external: [/^react($|\/)/, /^svelte($|\/)/],
		exports: {
			bin: false,
			customExports: (exports) => ({ ...exports, ...SVELTE }),
		},
	}),
);
