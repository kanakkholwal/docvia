import type { UserConfig } from "tsdown";

/** Shared build settings for every published package: ESM `.js`, generated `exports`. */
export function packageConfig(config: UserConfig): UserConfig {
	return {
		format: "esm",
		platform: "node",
		fixedExtension: false,
		dts: true,
		sourcemap: true,
		clean: true,
		treeshake: true,
		minify: false,
		outDir: "dist",
		target: false,
		exports: { bin: false },
		...config,
	};
}
