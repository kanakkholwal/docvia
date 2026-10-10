import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Source } from "./loader";
import type {
	ComponentRegistry,
	HydrationManifest,
	RenderOutput,
	StructuredData,
} from "./runtime";

/** Frontmatter every page has after validation. */
export interface BaseFrontmatter {
	title: string;
	description: string;
	tags: string[];
	draft: boolean;
	order?: number;
	/** Route slug, `index` for a collection's root page. */
	slug: string;
}

export interface TocItem {
	title: string;
	/** `#heading-id` */
	url: string;
	depth: number;
}

/** A page body, loaded on demand. */
export interface LoadedPage {
	content: RenderOutput;
	toc: TocItem[];
	headings: Array<{ depth: number; text: string; id: string }>;
	manifest: HydrationManifest;
	/** Search sections, extracted at compile time. */
	structuredData: StructuredData;
}

/** Page data: frontmatter plus `load()` for the compiled body. */
export type DocData<F> = F & { load(): Promise<LoadedPage> };

export interface DocsCollection<F> {
	/** The collection as a `loader()` source (fumadocs: `toFumadocsSource()`). */
	toDocviaSource(): Source<DocData<F>>;
}

type SchemaOutput<S> = S extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<S>
	: unknown;

export interface DefineDocsOptions<S> {
	/** Content directory, relative to the project root. Must be a string literal. */
	dir?: string;
	docs?: {
		/** Extra frontmatter fields (any Standard Schema: Zod, Valibot, ArkType). */
		schema?: S;
	};
}

// Set by the bundler plugin while it evaluates a module to read non-literal options (schemas).
const COLLECT = Symbol.for("docvia.macro.collect");
type Collector = (fn: string, options: unknown) => void;
const collector = () =>
	(globalThis as Record<symbol, Collector | undefined>)[COLLECT];

const notCompiled = (fn: string) =>
	new Error(
		`[docvia] ${fn}() ran without the docvia bundler plugin. Add docvia() to your Vite config (or withDocvia() for Next.js).`,
	);

/**
 * Declare a docs collection. The docvia bundler plugin rewrites this call at build time into
 * an index of the folder's pages, so nothing is scanned at runtime.
 */
export function defineDocs<S = undefined>(
	options?: DefineDocsOptions<S>,
): DocsCollection<BaseFrontmatter & SchemaOutput<S>> {
	const collect = collector();
	if (!collect) throw notCompiled("defineDocs");
	collect("defineDocs", options);
	return { toDocviaSource: () => ({ files: [] }) };
}

/** The component registry from `components` in `docvia.config`, with real imports. */
export function defineRegistry(): ComponentRegistry {
	if (!collector()) throw notCompiled("defineRegistry");
	return { resolve: () => null };
}
