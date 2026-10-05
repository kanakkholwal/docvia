import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		// `client` is browser-only and must not pull in @docvia/ir (node:path).
		entry: ["src/index.ts", "src/client.ts"],
	}),
);
