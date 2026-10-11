import { sidebarTree } from "#lib/source.ts";
import type { LayoutServerLoad } from "./$types";

// Docs are static: prerender them so the Worker only serves marketing routes and search.
export const prerender = true;

// The sidebar is the docvia page tree: the site dogfoods its own source.
export const load: LayoutServerLoad = async () => {
	return {
		tree: sidebarTree,
	};
};
