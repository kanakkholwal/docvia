// Prerender the whole demo to static HTML at build time. @docvia/source reads
// markdown from the filesystem (via the docvia/source virtual module) — fine in
// Node at build time, impossible in the Cloudflare Worker runtime. Prerendering
// moves that work to build time; Cloudflare then just serves static assets.
export const prerender = true;
