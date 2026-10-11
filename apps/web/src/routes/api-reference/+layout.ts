import { proxyRoute, reference } from "#lib/api-reference.ts";
import type { LayoutLoad } from "./$types";

export const prerender = true;

export const load: LayoutLoad = () => ({
	index: reference.index,
	proxy: proxyRoute,
});
