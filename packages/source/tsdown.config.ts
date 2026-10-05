import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		entry: [
			"src/index.ts",
			"src/internal.ts",
			"src/runtime.ts",
			"src/macro.ts",
			"src/macro-runtime.ts",
		],
	}),
);
