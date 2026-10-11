import type { AnalyticsProvider } from "./index";

export interface PostHogConfig {
	key: string;
	/** Ingestion host. Default PostHog US cloud. */
	host?: string;
}

/** Loads posthog-js on demand, so it stays out of the initial bundle. */
export async function createPostHogProvider(
	config: PostHogConfig,
): Promise<AnalyticsProvider> {
	const { default: posthog } = await import("posthog-js");
	posthog.init(config.key, {
		api_host: config.host ?? "https://us.i.posthog.com",
		// The router reports page views itself, including client-side navigations.
		capture_pageview: false,
		capture_pageleave: true,
		person_profiles: "identified_only",
		respect_dnt: true,
	});
	return {
		pageview: (url) => posthog.capture("$pageview", { $current_url: url.href }),
		track: (event, properties) => posthog.capture(event, properties),
	};
}
