/**
 * @docvia/renderer-react/client — browser-only entry point.
 *
 * Imports from `react-dom/client` (hydrateRoot, createRoot).
 * Must NEVER be imported in:
 *   - React Server Components
 *   - Node.js SSR render paths
 *   - Any module that runs during Next.js build without a browser context
 *
 * Typical usage — Next.js App Router:
 *
 *   "use client";
 *   import { useEffect } from 'react';
 *   import { hydrate } from '@docvia/renderer-react/client';
 *
 *   export function DocviaHydrator({ manifest, registry }) {
 *       useEffect(() => {
 *           hydrate(manifest, registry, { ssr: true });
 *       }, []);
 *       return null;
 *   }
 *
 * Typical usage — Vite SPA / Pages Router (client-side only):
 *
 *   import { hydrate } from '@docvia/renderer-react/client';
 *   hydrate(manifest, registry);
 */

export { hydrate } from './hydrate';
export type { HydrateOptions } from './hydrate';