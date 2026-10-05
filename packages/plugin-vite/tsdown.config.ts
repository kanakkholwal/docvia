import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		entry: ["src/index.ts"],
		// Vite's types reach postcss's dual .d.ts/.d.mts shim, which the dts bundler can't resolve.
		external: ["vite", /^postcss/],
		// Keep dist importable while watch mode rebuilds.
		clean: false,
	}),
);
