// Prerender the whole demo to static HTML at build time. The production
// `docvia/source` loader resolves pages by dynamically importing the emitted
// module graph (with an fs-based IR-chunk fallback) — both rely on a Node
// filesystem that doesn't exist in the Cloudflare Worker runtime, so SSR at the
// edge 404s. Prerendering renders every page in Node at build time; Cloudflare
// then serves the resulting static assets.
export const prerender = true;
