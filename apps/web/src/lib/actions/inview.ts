/**
 * Svelte action: dispatches an `inview` CustomEvent the first time the node
 * enters the viewport. Use to gate scroll-triggered transitions.
 *
 *   <div use:inview onenter={() => (shown = true)}>
 *     {#if shown}<Card in:fly={{ y: 12, duration: 280 }} />{/if}
 *   </div>
 */
export type InviewOptions = {
	once?: boolean;
	rootMargin?: string;
	threshold?: number;
};

export function inview(
	node: HTMLElement,
	options: InviewOptions = {},
): { destroy(): void } {
	if (typeof IntersectionObserver === "undefined") {
		// SSR / older browsers: fire immediately so content is never invisible.
		queueMicrotask(() => {
			node.dispatchEvent(new CustomEvent("enter"));
		});
		return { destroy() {} };
	}

	const once = options.once ?? true;
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.dispatchEvent(new CustomEvent("enter"));
					if (once) observer.disconnect();
				}
			}
		},
		{
			rootMargin: options.rootMargin ?? "0px 0px -8% 0px",
			threshold: options.threshold ?? 0.08,
		},
	);
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
	};
}
