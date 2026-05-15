import { docs } from "docvia/source";
import type { LayoutServerLoad } from "./$types";

// The sidebar is generated from the docvia source itself — the docs site
// dogfoods the compiler. `pageTree` is derived from the compiled collection.
export const load: LayoutServerLoad = async () => {
	return {
		tree: docs.pageTree,
	};
};
