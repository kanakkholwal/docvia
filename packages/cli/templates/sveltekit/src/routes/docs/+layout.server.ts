import { source } from "~lib/source";
import type { LayoutServerLoad } from "./$types";

// Docs are static: prerender them at build time.
export const prerender = true;

export const load: LayoutServerLoad = () => ({ tree: source.pageTree });
