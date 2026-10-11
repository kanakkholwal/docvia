import { defineEnvVars } from "@sveltejs/kit/env";

// Analytics are off unless PUBLIC_POSTHOG_KEY is set when the site is built.
export const variables = defineEnvVars({
	PUBLIC_POSTHOG_KEY: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: "PostHog project key; empty or unset turns analytics off.",
	},
	PUBLIC_POSTHOG_HOST: {
		public: true,
		static: true,
		schema: (value) => value || "https://us.i.posthog.com",
		description: "PostHog ingestion host.",
	},
});
