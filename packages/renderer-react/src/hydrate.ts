/**
 * Client-side island hydration for React.
 *
 * This module imports from `react-dom/client` and must ONLY be consumed via
 * the `@docvia/renderer-react/client` entry point. Never import it server-side
 * or in a React Server Component — Next.js will throw a build error if
 * `react-dom/client` lands in the RSC bundle.
 *
 * The manifest comes off a page loaded on the server (`docs.getPage(...)`) and is
 * passed in as a prop — a client component must not import the collection, which
 * eagerly pulls in every compiled page.
 *
 * Usage (Next.js App Router — client component):
 *
 *   "use client";
 *   import { useEffect } from 'react';
 *   import { hydrate } from '@docvia/renderer-react/client';
 *
 *   export function DocviaHydrator({ manifest, registry }) {
 *       useEffect(() => { hydrate(manifest, registry, { ssr: true }); }, [manifest]);
 *       return null;
 *   }
 *
 * Usage (Pages Router / Vite SPA):
 *
 *   import { hydrate } from '@docvia/renderer-react/client';
 *   hydrate(manifest, registry, { ssr: false });
 */

import type {
	ComponentRegistry,
	HydrationEntry,
	HydrationManifest,
} from "@docvia/renderer-core";
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

export interface HydrateOptions {
	/**
	 * Set `true` when the page was server-rendered (Next.js Pages Router,
	 * custom SSR). React will attach event handlers without re-rendering DOM.
	 *
	 * Set `false` (default) for client-only rendering (Vite SPA) — React
	 * creates a fresh root and renders into the wrapper element.
	 */
	ssr?: boolean;
}

const hydrated = new Set<string>();

/**
 * Hydrates interactive component islands declared in the hydration manifest.
 *
 * Each entry's `hydrate` field controls when hydration fires:
 *   - `client:load`    — immediately
 *   - `client:idle`    — on requestIdleCallback (or setTimeout fallback)
 *   - `client:visible` — on IntersectionObserver intersection
 *
 * Idempotent: calling hydrate() multiple times for the same manifest is safe.
 */
export function hydrate(
	manifest: HydrationManifest,
	registry: ComponentRegistry,
	options: HydrateOptions = {},
): void {
	const { ssr = false } = options;

	for (const entry of manifest) {
		if (hydrated.has(entry.id)) continue;

		switch (entry.hydrate) {
			case "client:load":
				mountIsland(entry, registry, ssr);
				break;

			case "client:idle":
				if (typeof requestIdleCallback !== "undefined") {
					requestIdleCallback(() => mountIsland(entry, registry, ssr));
				} else {
					// Safari < 16 and some older browsers don't support rIC
					setTimeout(() => mountIsland(entry, registry, ssr), 200);
				}
				break;

			case "client:visible":
				observeIntersection(entry.id, () => mountIsland(entry, registry, ssr));
				break;
		}
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mountIsland(
	entry: HydrationEntry,
	registry: ComponentRegistry,
	ssr: boolean,
): void {
	if (hydrated.has(entry.id)) return;

	const el = document.querySelector(`[data-hid="${entry.id}"]`);
	if (!el) {
		console.warn(`[docvia] Hydration target not found: data-hid="${entry.id}"`);
		return;
	}

	const resolved = registry.resolve(entry.name);
	if (!resolved) {
		console.error(
			`[docvia] Cannot hydrate: component "${entry.name}" not in registry`,
		);
		return;
	}

	try {
		// React.ElementType works for function components, class components,
		// and is forward-compatible with React 19 (no forwardRef assumption).
		const Component = resolved.component as React.ElementType;
		const element = React.createElement(
			Component,
			entry.props as Record<string, unknown>,
		);

		if (ssr) {
			// Page was server-rendered — attach React to existing DOM without
			// discarding it. React 18+: hydrateRoot(container, element).
			// React 19: same API, improved mismatch recovery.
			hydrateRoot(el as HTMLElement, element);
		} else {
			// Client-only render — replace wrapper content with a fresh React root.
			createRoot(el as HTMLElement).render(element);
		}

		hydrated.add(entry.id);
	} catch (err) {
		console.error(`[docvia] Hydration failed for island "${entry.id}":`, err);
	}
}

function observeIntersection(id: string, cb: () => void): void {
	// Defer querySelector until IntersectionObserver fires — element may not
	// be in the viewport yet, but it must exist in the DOM at observe time.
	const el = document.querySelector(`[data-hid="${id}"]`);
	if (!el) return;

	const observer = new IntersectionObserver(([entry]) => {
		if (entry?.isIntersecting) {
			cb();
			observer.disconnect();
		}
	});

	observer.observe(el);
}
