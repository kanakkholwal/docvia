import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/loader.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	outDir: "dist",
	treeshake: true,
	target: false,
});
