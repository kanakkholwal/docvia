"use client";

/**
 * Handles deferred island hydration (client:idle, client:visible).
 *
 * In the App Router, React Server Components that render 'use client'
 * components (like Counter) are hydrated automatically — no manual call
 * needed for client:load.
 *
 * This component handles the two deferred modes that React's normal RSC
 * hydration doesn't cover, using requestIdleCallback / IntersectionObserver.
 */

import type { HydrationManifest } from "@docvia/renderer-core";
import { hydrate } from "@docvia/renderer-react/client";
import { registry } from "docvia/registry";
import { useEffect } from "react";

interface Props {
	manifest: HydrationManifest;
}

export function DocviaHydrator({ manifest }: Props) {
	useEffect(() => {
		// ssr: true — the page was server-rendered, attach React to existing DOM
		hydrate(manifest, registry, { ssr: true });
	}, [manifest]);

	// Renders nothing — side-effect only
	return null;
}
