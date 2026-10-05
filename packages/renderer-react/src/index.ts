/**
 * @docvia/renderer-react — server-safe entry point.
 *
 * Safe to import in:
 *   - React Server Components (Next.js App Router)
 *   - SSR rendering paths (Pages Router, custom express/fastify servers)
 *   - Build-time adapter configuration
 *   - Client bundles (browser)
 *
 * Do NOT import `react-dom/client` from this entry.
 * For client-side island hydration use `@docvia/renderer-react/client`.
 */

export type {
	ComponentRegistry,
	HydrationManifest,
	ModuleRendererOptions as ReactRendererOptions,
	RenderOutput,
	RenderTransform,
} from "@docvia/renderer-core";
export { createReactRenderer } from "./adapter";
export type {
	CodeBlockOverrideProps,
	DocviaComponents,
	DocviaContentProps,
} from "./DocviaContent";
export { DocviaContent } from "./DocviaContent";
