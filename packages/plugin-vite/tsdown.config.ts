import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	sourcemap: true,
	// Keep the published entrypoint available while watch mode rebuilds so
	// consuming apps can still import the workspace package during startup.
	clean: false,
	outDir: "dist",
	treeshake: true,
	target: false,
});
