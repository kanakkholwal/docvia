import { redirect } from "@sveltejs/kit";
import { reference } from "#lib/api-reference.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
	const first = reference.index.operations[0];
	redirect(
		307,
		first ? `/api-reference/${first.slug}` : "/api-reference/drafts",
	);
};
