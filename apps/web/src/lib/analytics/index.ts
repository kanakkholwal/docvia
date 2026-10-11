export type Properties = Record<
	string,
	string | number | boolean | null | undefined
>;

/** What the site needs from an analytics service; implement this to swap PostHog for another. */
export interface AnalyticsProvider {
	pageview(url: URL): void;
	track(event: string, properties?: Properties): void;
}

let provider: AnalyticsProvider | null = null;
// Calls made before the provider loads are replayed once it does.
const queue: Array<(p: AnalyticsProvider) => void> = [];

function send(call: (p: AnalyticsProvider) => void) {
	if (provider) call(provider);
	else if (queue.length < 100) queue.push(call);
}

/** Installs the provider; calls queued before it loaded are flushed in order. */
export function setAnalyticsProvider(next: AnalyticsProvider): void {
	provider = next;
	for (const call of queue.splice(0)) call(next);
}

export const pageview = (url: URL) => send((p) => p.pageview(url));
export const track = (event: string, properties?: Properties) =>
	send((p) => p.track(event, properties));

/** Tracks clicks on any element with `data-track="event"`, plus `data-track-*` properties. */
export function trackClicks(root: Document): () => void {
	const onClick = (event: MouseEvent) => {
		const el = (event.target as Element | null)?.closest<HTMLElement>(
			"[data-track]",
		);
		if (!el?.dataset.track) return;
		const properties: Properties = {};
		for (const [key, value] of Object.entries(el.dataset))
			if (key.startsWith("track") && key !== "track")
				properties[key.slice(5).toLowerCase()] = value;
		const href = el.getAttribute("href");
		if (href) properties.href = href;
		track(el.dataset.track, properties);
	};
	root.addEventListener("click", onClick, { capture: true });
	return () => root.removeEventListener("click", onClick, { capture: true });
}
