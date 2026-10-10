import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		entry: {
			index: "src/index.ts",
			"vite/index": "src/vite/index.ts",
			"next/index": "src/next/index.ts",
			"next/loader": "src/next/loader.ts",
			"next/macro-loader": "src/next/macro-loader.ts",
		},
		// Vite's types reach postcss's dual .d.ts/.d.mts shim, which the dts bundler can't resolve.
		external: ["vite", /^postcss/, "next", /^next\//, "webpack", /^@docvia\/core/],
		// Keep dist importable while watch mode rebuilds.
		clean: false,
	}),
);
