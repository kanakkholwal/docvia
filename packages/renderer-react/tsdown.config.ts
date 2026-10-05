import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.base.ts";

export default defineConfig(
	packageConfig({
		// `client` imports react-dom/client, so it stays out of the SSR entry.
		entry: { index: "src/index.ts", client: "src/client.ts" },
	}),
);
