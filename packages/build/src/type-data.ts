import { relative } from "node:path";
import { composeFrontmatterType, inferSchemaOutput } from "@docvia/core/schema";
import type { ResolvedCollection } from "./collections";
import type { CollectionData } from "./emit";
import { stableStringify } from "./hash";

/**
 * Type-generation data per collection: route slugs plus a frontmatter type, read from the
 * collection's schema in the config file, else a union of the frontmatter actually seen.
 */
export function collectionTypeData(
	collections: readonly ResolvedCollection[],
	pages: readonly { collection: string; meta: Record<string, unknown> }[],
	outDir: string,
	configPath?: string,
): CollectionData[] {
	return collections
		.filter((c) => !c.macro)
		.map((collection) => {
			const own = pages.filter((p) => p.collection === collection.name);
			const slugs = own.map((p) => String(p.meta.slug)).sort();
			let frontmatterTypeDef: string;
			if (collection.frontmatter && configPath) {
				const rel = relative(outDir, configPath)
					.replace(/\\/g, "/")
					.replace(/\.(mts|cts|ts|tsx|mjs|cjs|js|jsx)$/, "");
				const config = `(typeof import(${JSON.stringify(rel.startsWith(".") ? rel : `./${rel}`)}))["default"]`;
				const schemaRef = collection.ownSchema
					? `NonNullable<Extract<NonNullable<${config}["collections"]>[number], { name: ${JSON.stringify(collection.name)} }>["frontmatter"]>`
					: `NonNullable<${config}["frontmatter"]>`;
				frontmatterTypeDef = composeFrontmatterType(
					inferSchemaOutput(schemaRef),
				);
			} else if (collection.frontmatter) {
				frontmatterTypeDef = composeFrontmatterType();
			} else {
				const samples = [
					...new Set(
						own.map(({ meta }) => {
							const { slug: _slug, ...frontmatter } = meta;
							return stableStringify(frontmatter);
						}),
					),
				];
				frontmatterTypeDef =
					samples.length > 0 ? samples.join(" | ") : "Record<string, unknown>";
			}
			return {
				name: collection.name,
				baseUrl: collection.baseUrl,
				slugs,
				frontmatterTypeDef,
			};
		});
}
