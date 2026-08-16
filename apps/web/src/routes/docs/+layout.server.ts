import { docs } from "virtual:docvia/source";
import type { LayoutServerLoad } from "./$types";

// Prerender the docs subtree to static HTML at build time. @docvia/source reads
// markdown from the filesystem — fine in Node at build time, impossible in the
// Cloudflare Worker runtime. The marketing routes stay dynamic.
export const prerender = true;

// The sidebar is generated from the docvia source itself — the site dogfoods
// the compiler. `pageTree` is derived from the compiled collection.
export const load: LayoutServerLoad = async () => {
	return {
		tree: docs.pageTree,
	};
};
