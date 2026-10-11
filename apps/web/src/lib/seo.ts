export const SITE = {
	url: "https://docvia.dev",
	name: "docvia",
	tagline: "Markdown docs, built into your app",
	description:
		"Open-source docs framework: collections, a page tree, typed frontmatter and search for Next.js, SvelteKit and TanStack Start. Your bundler compiles the Markdown, rendered with React or Svelte, and it runs on Cloudflare Workers.",
	repo: "https://github.com/kanakkholwal/docvia",
	image: "/og.png",
} as const;

/** Absolute URL on the canonical origin, whatever host served the page. */
export const absolute = (path: string) => new URL(path, SITE.url).href;

/** JSON-LD for a script tag; `<` is escaped so text can never close it early. */
export const jsonLd = (data: unknown) =>
	`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\u003c")}</script>`;
