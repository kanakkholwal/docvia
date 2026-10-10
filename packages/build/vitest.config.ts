import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		// The Next.js tests cold-load next and jiti, which takes over 5 s while other files run in parallel.
		testTimeout: 20000,
	},
});
