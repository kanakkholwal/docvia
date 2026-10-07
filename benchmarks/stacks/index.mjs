import docviaNext from "./docvia-next.mjs";
import docviaSvelteKit from "./docvia-sveltekit.mjs";
import docviaTanStackStart from "./docvia-tanstack-start.mjs";
import {
	fumadocsAstro,
	fumadocsNext,
	fumadocsReactRouter,
	fumadocsTanStackStart,
	fumadocsWaku,
} from "./fumadocs.mjs";
import {
	docus,
	docusaurus,
	rspress,
	starlight,
	sveltepress,
	vitepress,
} from "./others.mjs";

/** Every stack, in report order. Nextra is left out: it has no working CLI-only starter. */
export const STACKS = [
	docviaSvelteKit,
	docviaTanStackStart,
	docviaNext,
	fumadocsNext,
	fumadocsTanStackStart,
	fumadocsReactRouter,
	fumadocsWaku,
	fumadocsAstro,
	sveltepress,
	starlight,
	docusaurus,
	rspress,
	docus,
	vitepress,
];
