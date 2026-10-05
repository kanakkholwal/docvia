// What compiled `defineDocs()` / `defineRegistry()` calls run. Not public API.
import type { ModuleExports } from "./internal";
import type { MetaData } from "./loader";
import type { DocData, DocsCollection, LoadedPage } from "./macro";
import type { ComponentRegistry } from "./runtime";

type Entry = NonNullable<ReturnType<ComponentRegistry["resolve"]>>;

export interface GeneratedDocs {
	/** Frontmatter per page, keyed by path relative to the collection directory. */
	meta: Record<string, Record<string, unknown> & { slug: string }>;
	/** Lazy page bodies, keyed `./path` (Vite glob keys with `base`). */
	bodies: Record<string, () => Promise<ModuleExports>>;
	/** `meta.json` files, keyed `./path`. */
	metaFiles: Record<string, MetaData>;
}

const strip = (key: string) => key.replace(/^\.\//, "");

export function docs<F>(
	_options: unknown,
	gen: GeneratedDocs,
): DocsCollection<F> {
	const bodies = new Map<string, () => Promise<ModuleExports>>();
	for (const [key, load] of Object.entries(gen.bodies)) {
		bodies.set(strip(key), load);
		// Index and glob paths can differ only in case on case-insensitive file systems.
		bodies.set(strip(key).toLowerCase(), load);
	}
	const loaded = new Map<string, Promise<LoadedPage>>();
	const load = (path: string): Promise<LoadedPage> => {
		let pending = loaded.get(path);
		if (!pending) {
			const body = bodies.get(path) ?? bodies.get(path.toLowerCase());
			if (!body)
				return Promise.reject(new Error(`[docvia] No body for ${path}`));
			pending = body().then((mod) => {
				const headings = mod.meta?.headings ?? [];
				return {
					content: mod.content,
					manifest: mod.manifest as LoadedPage["manifest"],
					structuredData: mod.structuredData ?? { headings: [], contents: [] },
					headings,
					toc: headings.map((h) => ({
						title: h.text,
						url: `#${h.id}`,
						depth: h.depth,
					})),
				};
			});
			loaded.set(path, pending);
		}
		return pending;
	};

	return {
		toDocviaSource() {
			return {
				files: [
					...Object.entries(gen.meta).map(([path, frontmatter]) => ({
						type: "page" as const,
						path,
						slugs:
							frontmatter.slug === "index" ? [] : frontmatter.slug.split("/"),
						data: {
							...frontmatter,
							load: () => load(path),
						} as unknown as DocData<F>,
					})),
					...Object.entries(gen.metaFiles).map(([key, data]) => ({
						type: "meta" as const,
						path: strip(key),
						data,
					})),
				],
			};
		},
	};
}

export function registry(components: Record<string, Entry>): ComponentRegistry {
	return { resolve: (name) => components[name] ?? null };
}
