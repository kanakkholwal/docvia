import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	// The public API returns Vite's `Plugin` type, whose declarations
	// transitively reference postcss via inline `import('postcss')`. The dts
	// bundler can't resolve postcss's dual .d.ts/.d.mts export shim (124
	// MISSING_EXPORT errors). Keep vite/postcss external so the bundler stops
	// at the package boundary and emits `import('vite')` / `import('postcss')`
	// references instead of trying to inline them.
	external: ["vite", /^postcss/],
	sourcemap: true,
	// Keep the published entrypoint available while watch mode rebuilds so
	// consuming apps can still import the workspace package during startup.
	clean: false,
	outDir: "dist",
	treeshake: true,
	target: false,
});
