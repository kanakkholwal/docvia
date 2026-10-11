import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		entry: ["src/index.ts", "src/proxy.ts", "src/source.ts", "src/vite.ts"],
	}),
);
