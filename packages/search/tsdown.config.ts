import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		entry: ["src/index.ts", "src/node.ts"],
	}),
);
