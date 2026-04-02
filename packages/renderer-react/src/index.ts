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

export { DocviaContent } from './DocviaContent';
export type { CodeBlockOverrideProps, DocviaComponents, DocviaContentProps } from './DocviaContent';

export {
    createReactRenderer,
    createShikiHighlighter,
    createInMemoryStore,
    docviaVitePlugin,
    invalidateModules,
} from './adapter';
export type { InMemoryStore } from './adapter';