import { error } from "@sveltejs/kit";
import { docsUrl, reference } from "#lib/api-reference.ts";
import type { EntryGenerator, PageLoad } from "./$types";

export const entries: EntryGenerator = () =>
	reference.index.operations.map((op) => ({ slug: op.slug }));

export const load: PageLoad = async ({ params }) => {
	const summary = reference.index.operations.find(
		(op) => op.slug === params.slug,
	);
	if (!summary) error(404, "No such operation");
	return {
		op: await reference.operation(params.slug),
		docsUrl: docsUrl(summary),
	};
};
