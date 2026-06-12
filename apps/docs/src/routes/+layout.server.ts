import { docs } from "virtual:docvia/source";
import type { LayoutServerLoad } from "./$types";

// Prerender the whole site to static HTML at build time. @docvia/source reads
// markdown from the filesystem — fine in Node at build time, impossible in the
// Cloudflare Worker runtime. Prerendering moves all that work to build time;
// Cloudflare then just serves the resulting static assets.
export const prerender = true;

// The sidebar is generated from the docvia source itself — the docs site
// dogfoods the compiler. `pageTree` is derived from the compiled collection.
export const load: LayoutServerLoad = async () => {
	return {
		tree: docs.pageTree,
	};
};
