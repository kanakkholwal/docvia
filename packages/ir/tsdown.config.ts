import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		entry: ["src/index.ts", "src/transform.ts"],
		deps: { onlyBundle: ["@types/hast", "@types/unist"] },
	}),
);
