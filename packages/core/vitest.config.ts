import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		// The first test pays to cold-load the whole unified/remark/rehype
		// pipeline (a large ESM graph); on a cold CI or Windows run that import
		// alone can exceed the 5s default. Give it headroom — subsequent tests
		// reuse the warmed processor cache and finish in well under a second.
		testTimeout: 20000,
	},
});
