import { basename } from "node:path";
import type {
	docviaConfig,
	FileEntry,
	FrontmatterData,
	FrontmatterSchema,
	IRDocument,
	RendererAdapter,
} from "@docvia/ir";
import { computeSlug } from "@docvia/ir";
import { PluginRunner } from "@docvia/plugins";
import { extractFrontmatter, validateFrontmatter } from "@docvia/schema";
import { xxh64 } from "@node-rs/xxhash";
import {
	locate,
	type ResolvedCollection,
	resolveCollections,
} from "./collections";
import { computeContentHash, hashConfig, stableStringify } from "./hash";
import { markdownToIR } from "./pipeline";

/** What a page exposes without compiling its body: validated frontmatter plus its slug. */
export type PageMetaRecord = FrontmatterData & { readonly slug: string };

interface CacheEntry {
	readonly hash: string;
	ir?: Promise<IRDocument>;
	code?: Promise<string>;
}

function omitKeys(
	data: Record<string, unknown>,
	keys: readonly string[] | undefined,
): Record<string, unknown> {
	if (!keys?.length) return data;
	const out = { ...data };
	for (const k of keys) delete out[k];
	return out;
}

/**
 * Compiles single pages on demand: `meta()` reads frontmatter only (no markdown parse), and
 * `document()` / `module()` run the full pipeline, memoised by content hash in memory.
 */
export class PagePipeline {
	readonly config: docviaConfig;
	private readonly all: ResolvedCollection[];
	private readonly runner: PluginRunner;
	private readonly configHash: string;
	private readonly pluginCacheKeys: string[];
	private readonly cache = new Map<string, CacheEntry>();

	constructor(config: docviaConfig, projectRoot: string) {
		this.config = config;
		this.all = resolveCollections(config, projectRoot);
		this.runner = new PluginRunner([...config.plugins]);
		this.configHash = hashConfig(config);
		this.pluginCacheKeys = this.runner.getPluginCacheKeys();
	}

	/** Config collections plus any registered by `defineDocs()`. */
	get collections(): readonly ResolvedCollection[] {
		return this.all;
	}

	/** Add (or update) a collection declared in code, e.g. by `defineDocs()`. */
	registerCollection(def: {
		name: string;
		dir: string;
		frontmatter?: FrontmatterSchema;
	}): ResolvedCollection {
		const collection: ResolvedCollection = {
			name: def.name,
			dir: def.dir,
			baseUrl: "/",
			frontmatter: def.frontmatter ?? this.config.frontmatter,
			ownSchema: def.frontmatter !== undefined,
			optional: false,
			macro: true,
		};
		const i = this.all.findIndex((c) => c.name === def.name);
		if (i === -1) this.all.push(collection);
		else this.all[i] = collection;
		return collection;
	}

	get renderer(): RendererAdapter {
		const renderer = this.config.renderer;
		if (!renderer) throw new Error("[docvia] No renderer configured");
		return renderer;
	}

	/** The owning collection (by name, else by path) and the path relative to it. */
	locate(
		absPath: string,
		collectionName?: string,
	): { collection?: ResolvedCollection; relativePath: string } {
		const byPath = locate(this.collections, absPath);
		if (
			byPath &&
			(!collectionName || byPath.collection.name === collectionName)
		) {
			return byPath;
		}
		return { relativePath: basename(absPath) };
	}

	private file(absPath: string, code: string, relativePath: string): FileEntry {
		return {
			path: absPath,
			relativePath,
			content: code,
			hash: xxh64(Buffer.from(code)).toString(36),
		};
	}

	async meta(
		absPath: string,
		code: string,
		collectionName?: string,
	): Promise<PageMetaRecord> {
		const { collection, relativePath } = this.locate(absPath, collectionName);
		const file = await this.runner.runBeforeParse(
			this.file(absPath, code, relativePath),
		);
		const { data } = extractFrontmatter(file.content);
		const frontmatter = validateFrontmatter(
			data,
			absPath,
			collection?.frontmatter ?? this.config.frontmatter,
		);
		return {
			...frontmatter,
			slug: computeSlug(relativePath, frontmatter.slug),
		};
	}

	private entry(
		absPath: string,
		code: string,
		collectionName?: string,
	): CacheEntry {
		const key = `${collectionName ?? ""}\0${absPath}`;
		const hash = xxh64(Buffer.from(code)).toString(36);
		let entry = this.cache.get(key);
		if (!entry || entry.hash !== hash) {
			entry = { hash };
			this.cache.set(key, entry);
		}
		return entry;
	}

	document(
		absPath: string,
		code: string,
		collectionName?: string,
	): Promise<IRDocument> {
		const entry = this.entry(absPath, code, collectionName);
		if (!entry.ir) {
			entry.ir = this.compile(absPath, code, collectionName);
			// A failed compile must not stick: the next request retries.
			entry.ir.catch(() => {
				entry.ir = undefined;
				entry.code = undefined;
			});
		}
		return entry.ir;
	}

	/** The rendered page module (`meta`, `content`, `manifest`). */
	module(
		absPath: string,
		code: string,
		collectionName?: string,
	): Promise<string> {
		const entry = this.entry(absPath, code, collectionName);
		entry.code ??= this.document(absPath, code, collectionName).then(
			async (ir) => (await this.renderer.renderPage(ir)).code,
		);
		return entry.code;
	}

	private async compile(
		absPath: string,
		code: string,
		collectionName?: string,
	): Promise<IRDocument> {
		const { collection, relativePath } = this.locate(absPath, collectionName);
		const file = this.file(absPath, code, relativePath);
		const { ir } = await markdownToIR({
			file,
			config: this.config,
			frontmatterSchema: collection?.frontmatter,
			runner: this.runner,
			contentHash: (frontmatter) =>
				computeContentHash({
					fileContent: file.hash,
					frontmatter: stableStringify(
						omitKeys(frontmatter, this.config.hashExclude),
					),
					configHash: this.configHash,
					pluginCacheKeys: this.pluginCacheKeys,
					dependencyHashes: [],
				}),
		});
		return ir;
	}
}
