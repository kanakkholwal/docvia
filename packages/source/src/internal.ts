import type { docviaCollection, docviaSource } from "./runtime";

interface CollectionMetaEntry<TRouteKey extends string> {
	slug: TRouteKey;
	tags?: readonly string[];
	headings?: Array<{ depth: number; text: string; id: string }>;
}

export function createCollection<
	TFrontmatter = unknown,
	const TRoutes extends Record<string, string> = Record<string, string>,
>(opts: {
	name: string;
	baseUrl: string;
	routes: TRoutes;
	sourceModuleUrl: string;
	meta: CollectionMetaEntry<keyof TRoutes & string>[];
	nav: unknown;
	tags: Partial<Record<string, (keyof TRoutes & string)[]>>;
}): docviaCollection<TFrontmatter, keyof TRoutes & string> {
	const { baseUrl, routes, sourceModuleUrl, meta, nav, tags } = opts;

	async function loadModule(modulePath: string) {
		if (typeof window === "undefined") {
			try {
				return await import(
					/* @vite-ignore */ /* webpackIgnore: true */ modulePath
				);
			} catch {
				const { fileURLToPath } = await import("node:url");
				const filePath = fileURLToPath(
					new URL(
						modulePath.replace(/\?docvia$/, "").replace(/^\//, "../"),
						sourceModuleUrl,
					),
				);
				const { loadMarkdown } = await import("./node.js");
				return loadMarkdown(filePath);
			}
		} else {
			return await import(
				/* @vite-ignore */ /* webpackIgnore: true */ modulePath
			);
		}
	}

	return {
		async getPage(slugs) {
			const normalizedSlugs = slugs?.filter(Boolean) ?? [];
			const key = (normalizedSlugs.join("/") || "index") as keyof TRoutes &
				string;
			const modulePath = routes[key];
			if (!modulePath) return null;

			const mod = await loadModule(modulePath);
			const pageMetaEntry = meta.find((entry: any) => entry.slug === key);

			return {
				slug: key,
				slugs: normalizedSlugs,
				url: baseUrl + (key === "index" ? "" : `/${key}`),
				data: mod.meta as TFrontmatter,
				content: mod.content,
				manifest: mod.manifest,
				headings: pageMetaEntry?.headings,
			};
		},

		getAllPages() {
			return Object.keys(routes) as (keyof TRoutes & string)[];
		},

		getTree() {
			return nav;
		},

		getPagesByTag(tag) {
			return (tags[tag] ?? []) as (keyof TRoutes & string)[];
		},

		getRelated(slug) {
			const page = meta.find((entry) => entry.slug === slug);
			if (!page?.tags?.length) return [];

			const out = new Set<keyof TRoutes & string>();
			for (const tag of page.tags) {
				for (const relatedSlug of tags[tag] ?? []) {
					if (relatedSlug !== slug) {
						out.add(relatedSlug);
					}
				}
			}
			return Array.from(out).slice(0, 5);
		},
	};
}

export function createSource<
	TCollections extends Record<string, docviaCollection<unknown, string>>,
>(collections: TCollections): docviaSource & { collections: TCollections } {
	return { collections };
}
