// CompileService — the stateful core shared by build, dev, and SSR modes.
//
// It holds the resolved config, plugin runner, plugin cache keys, the
// incremental cache, and the in-memory module graph for the lifetime of a
// process. The batch `compile()` in @docvia/compiler is a thin wrapper around
// `compileAll()` + `emitDiskModuleGraph()`; dev and SSR adapters (later
// milestones) drive the same instance so all modes share one render path.

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve as resolvePath } from "node:path";
import { performance } from "node:perf_hooks";
import { parseMarkdown } from "@docvia/core";
import type {
	CompileResult,
	CompilerOptions,
	docviaConfig,
	FileEntry,
	IRDocument,
	PageMeta,
} from "@docvia/ir";
import { transformToIR } from "@docvia/ir";
import { PluginRunner } from "@docvia/plugins";
import {
	extractFrontmatter,
	validateFrontmatter,
	zodSchemaToFrontmatterTs,
} from "@docvia/schema";
import type { Root as HastRoot } from "hast";
import {
	CACHE_VERSION,
	type CachedEntry,
	type CacheFile,
	cacheIsCompatible,
	readCache,
	writeCache,
} from "./cache";
import {
	type CollectionData,
	emitModuleGraphFiles,
	generateVirtualSource,
	type RouteFile,
	warnInvalidShikiLangs,
	emitTypeDeclarations as writeTypeDeclarations,
} from "./emit";
import { compileParallel, readFileEntry, readFileTree } from "./fs";
import { computeContentHash, hashConfig, stableStringify } from "./hash";

// Tool version: keep in sync with package.json. Bumped when the generated
// module shape changes — invalidates the on-disk cache automatically.
export const TOOL_VERSION = "0.1.0";

interface ResolvedCollection {
	readonly name: string;
	readonly sourceDir: string;
	readonly baseUrl?: string;
}

/** In-memory record for one compiled document. */
export interface ServiceEntry {
	readonly collectionName: string;
	readonly relativePath: string;
	readonly filePath: string;
	readonly fileHash: string;
	readonly contentHash: string;
	readonly page: PageMeta;
	readonly route: string;
	/** True when served from the incremental cache (no fresh IR available). */
	readonly cached: boolean;
	/** Populated only for freshly-compiled entries. */
	readonly ir?: IRDocument;
}

export class CompileService {
	readonly config: docviaConfig;

	private readonly projectRoot: string;
	private readonly resolvedOutDir: string;
	private readonly incremental: boolean;
	private readonly pluginRunner: PluginRunner;
	private readonly configHash: string;
	private readonly pluginCacheKeys: string[];
	private readonly collections: readonly ResolvedCollection[];

	private prevCache: CacheFile | null = null;
	private cacheCompatible = false;
	private cacheLoaded = false;
	private readonly newCacheEntries: Record<string, CachedEntry> = {};
	private readonly entries = new Map<string, ServiceEntry>();
	private collectionData: CollectionData[] = [];

	constructor(options: CompilerOptions) {
		this.config = options.config;
		this.projectRoot = resolvePath(options.projectRoot ?? process.cwd());
		this.resolvedOutDir = resolvePath(options.outDir);
		this.incremental = options.incremental !== false;
		this.pluginRunner = new PluginRunner(options.plugins);
		this.configHash = hashConfig(options.config);
		this.pluginCacheKeys = this.pluginRunner.getPluginCacheKeys();
		this.collections = (
			options.config.collections ?? [
				{ name: "docs", sourceDir: options.sourceDir, baseUrl: "/" },
			]
		).map((c) => ({
			name: c.name,
			sourceDir: c.sourceDir,
			baseUrl: c.baseUrl,
		}));
	}

	/** Load the on-disk incremental cache. Idempotent. */
	async loadCache(): Promise<void> {
		if (this.cacheLoaded) return;
		this.cacheLoaded = true;
		this.prevCache = this.incremental
			? await readCache(this.resolvedOutDir)
			: null;
		this.cacheCompatible = cacheIsCompatible(
			this.prevCache,
			TOOL_VERSION,
			this.configHash,
			this.pluginCacheKeys,
		);
	}

	private cacheKeyFor(collectionName: string, relativePath: string): string {
		return `${collectionName}:${relativePath}`;
	}

	/**
	 * Run the full parse → transform → plugin pipeline for one file. Always
	 * recompiles — the cache is consulted by `compileFile`, not here. This is
	 * the single source of truth for how a document becomes IR.
	 */
	private async runPipeline(
		collection: ResolvedCollection,
		file: FileEntry,
	): Promise<ServiceEntry> {
		const processedFile = await this.pluginRunner.runBeforeParse(file);
		const extracted = extractFrontmatter(processedFile.content);
		const frontmatter = validateFrontmatter(
			extracted.data,
			file.path,
			this.config.frontmatter as never,
		);

		const { ast } = await parseMarkdown(extracted.content, {
			remarkPlugins: this.config.markdown.remarkPlugins,
		});

		const processedAst = (await this.pluginRunner.runAfterParse(
			ast,
			processedFile,
		)) as HastRoot;
		const finalAst = (await this.pluginRunner.runBeforeTransform(
			processedAst,
			frontmatter,
		)) as HastRoot;

		let irDoc: IRDocument = transformToIR(
			finalAst,
			frontmatter,
			file.relativePath,
		);
		const contentHash = computeContentHash({
			fileContent: file.hash,
			frontmatter: stableStringify(frontmatter),
			configHash: this.configHash,
			pluginCacheKeys: this.pluginCacheKeys,
			dependencyHashes: [],
		});
		irDoc = { ...irDoc, contentHash };
		irDoc = await this.pluginRunner.runAfterTransform(irDoc);
		irDoc = await this.pluginRunner.runBeforeRender(irDoc);

		const slug = irDoc.slug;
		const relPath = relative(
			this.resolvedOutDir,
			resolvePath(file.path),
		).replace(/\\/g, "/");
		const route = `./${relPath}?docvia`;

		const page: PageMeta = {
			slug,
			title: irDoc.frontmatter.title,
			description: irDoc.frontmatter.description,
			headings: irDoc.headings,
			contentHash,
			lastModified: Date.now(),
			tags: irDoc.frontmatter.tags || [],
			order: irDoc.frontmatter.order,
		};

		return {
			collectionName: collection.name,
			relativePath: file.relativePath,
			filePath: file.path,
			fileHash: file.hash,
			contentHash,
			page,
			route,
			cached: false,
			ir: irDoc,
		};
	}

	/**
	 * Compile one file, reusing the incremental cache when the file hash and
	 * pipeline key are unchanged. Records the result in the in-memory graph.
	 */
	async compileFile(
		collection: ResolvedCollection,
		file: FileEntry,
	): Promise<ServiceEntry> {
		const cacheKey = this.cacheKeyFor(collection.name, file.relativePath);
		const prev = this.cacheCompatible
			? this.prevCache?.entries[cacheKey]
			: undefined;

		// Cache hit: file content unchanged AND cache is compatible.
		if (prev && prev.fileHash === file.hash) {
			const entry: ServiceEntry = {
				collectionName: collection.name,
				relativePath: file.relativePath,
				filePath: file.path,
				fileHash: file.hash,
				contentHash: prev.contentHash,
				page: prev.page,
				route: prev.route,
				cached: true,
			};
			this.newCacheEntries[cacheKey] = prev;
			this.entries.set(cacheKey, entry);
			return entry;
		}

		// Cache miss: full pipeline.
		const entry = await this.runPipeline(collection, file);
		this.newCacheEntries[cacheKey] = {
			fileHash: entry.fileHash,
			contentHash: entry.contentHash,
			page: entry.page,
			route: entry.route,
		};
		this.entries.set(cacheKey, entry);
		return entry;
	}

	/** Compile every file in every collection and build the module graph. */
	async compileAll(): Promise<CompileResult> {
		const startTime = performance.now();
		await this.loadCache();
		warnInvalidShikiLangs(this.config.syntax.langs);

		const allPages: PageMeta[] = [];
		this.collectionData = [];
		let totalFiles = 0;
		let totalCompiled = 0;
		let totalCached = 0;

		for (const collection of this.collections) {
			const resolvedSourceDir = resolvePath(
				this.projectRoot,
				collection.sourceDir,
			);
			const files = await readFileTree(resolvedSourceDir);
			totalFiles += files.length;

			const pages: PageMeta[] = [];
			const routes: Record<string, string> = {};
			const frontmatterSamples: string[] = [];

			await compileParallel(files, async (file) => {
				const entry = await this.compileFile(collection, file);
				pages.push(entry.page);
				routes[entry.page.slug] = entry.route;
				if (entry.cached) {
					totalCached++;
				} else {
					totalCompiled++;
					if (entry.ir) {
						frontmatterSamples.push(stableStringify(entry.ir.frontmatter));
					}
				}
			});

			// Build frontmatter type definition
			let frontmatterTypeDef: string;
			if (this.config.frontmatter) {
				frontmatterTypeDef = zodSchemaToFrontmatterTs(
					this.config.frontmatter as never,
				);
			} else {
				const unique = Array.from(new Set(frontmatterSamples));
				frontmatterTypeDef =
					unique.length > 0 ? unique.join(" | ") : "Record<string, unknown>";
			}

			this.collectionData.push({
				name: collection.name,
				baseUrl: (
					collection.baseUrl ??
					`/${collection.name === "docs" ? "" : collection.name}`
				).replace(/\/+/g, "/"),
				routes,
				frontmatterTypeDef,
			});
			allPages.push(...pages);
		}

		return {
			pages: allPages,
			searchIndex: "",
			duration: performance.now() - startTime,
			stats: {
				total: totalFiles,
				compiled: totalCompiled,
				cached: totalCached,
			},
		};
	}

	/** The collection/route data backing the module graph. */
	getCollectionData(): readonly CollectionData[] {
		return this.collectionData;
	}

	/**
	 * Resolve a single document's IR by collection + slug. Returns a
	 * freshly-compiled IR; entries served from the incremental cache (which
	 * stores no IR) are recompiled on demand.
	 */
	async getDocument(
		collectionName: string,
		slug: string,
	): Promise<IRDocument | undefined> {
		for (const entry of this.entries.values()) {
			if (entry.collectionName !== collectionName) continue;
			if (entry.page.slug !== slug) continue;
			if (entry.ir) return entry.ir;

			const collection = this.collections.find(
				(c) => c.name === collectionName,
			);
			if (!collection) return undefined;
			const file = await readFileEntry(entry.filePath, entry.relativePath);
			const fresh = await this.runPipeline(collection, file);
			return fresh.ir;
		}
		return undefined;
	}

	/**
	 * Resolve a document's IR by its absolute source-file path. Used by the dev
	 * plugin's `.md?docvia` transform so its output matches the build pipeline
	 * (same plugins, same highlighting).
	 */
	async getDocumentByPath(absPath: string): Promise<IRDocument | undefined> {
		const target = resolvePath(absPath);
		for (const entry of this.entries.values()) {
			if (resolvePath(entry.filePath) !== target) continue;
			if (entry.ir) return entry.ir;

			const collection = this.collections.find(
				(c) => c.name === entry.collectionName,
			);
			if (!collection) return undefined;
			const file = await readFileEntry(entry.filePath, entry.relativePath);
			const fresh = await this.runPipeline(collection, file);
			return fresh.ir;
		}
		return undefined;
	}

	/**
	 * Generate the consolidated `docvia/source` module as a string — the
	 * dev-server virtual-module form of the on-disk module graph. Call after
	 * `compileAll()`.
	 */
	getVirtualSourceModule(): string {
		const routeFiles = new Map<string, RouteFile[]>();
		for (const entry of this.entries.values()) {
			let list = routeFiles.get(entry.collectionName);
			if (!list) {
				list = [];
				routeFiles.set(entry.collectionName, list);
			}
			list.push({ slug: entry.page.slug, absPath: entry.filePath });
		}
		return generateVirtualSource(
			this.collectionData,
			routeFiles,
			this.config,
			this.projectRoot,
		);
	}

	/** Write only the IDE type declarations (`types.d.ts` + `docvia-env.d.ts`). */
	async emitTypeDeclarations(): Promise<void> {
		await writeTypeDeclarations({
			outDir: this.resolvedOutDir,
			projectRoot: this.projectRoot,
			config: this.config,
			collections: this.collectionData,
		});
	}

	/**
	 * Emit one serialized IR chunk per route under `<outDir>/ir/`, plus an
	 * `ir/manifest.json` index. These per-route chunks are the SSR/edge content
	 * source: a `BundledContentProvider` loads a single chunk per request
	 * without parsing markdown or touching the source tree.
	 *
	 * Cache hits whose chunk already exists on disk are skipped — an unchanged
	 * `contentHash` guarantees the existing chunk is still valid.
	 */
	private async emitIrChunks(): Promise<void> {
		const irDir = join(this.resolvedOutDir, "ir");
		await mkdir(irDir, { recursive: true });

		const manifest: Record<string, Record<string, string>> = {};
		for (const entry of this.entries.values()) {
			const rel = `${entry.collectionName}/${entry.page.slug}.json`;
			let collectionMap = manifest[entry.collectionName];
			if (!collectionMap) {
				collectionMap = {};
				manifest[entry.collectionName] = collectionMap;
			}
			collectionMap[entry.page.slug] = rel;

			const chunkPath = join(irDir, rel);
			if (entry.cached && existsSync(chunkPath)) continue;

			const ir =
				entry.ir ??
				(await this.getDocument(entry.collectionName, entry.page.slug));
			if (!ir) continue;
			await mkdir(dirname(chunkPath), { recursive: true });
			await writeFile(chunkPath, JSON.stringify(ir));
		}

		await writeFile(
			join(irDir, "manifest.json"),
			JSON.stringify(manifest, null, 2),
		);
	}

	/** Write the disk module graph + IR chunks and persist the cache. */
	async emitDiskModuleGraph(): Promise<void> {
		await emitModuleGraphFiles({
			outDir: this.resolvedOutDir,
			projectRoot: this.projectRoot,
			config: this.config,
			collections: this.collectionData,
		});
		await this.emitIrChunks();

		if (this.incremental) {
			const cache: CacheFile = {
				version: CACHE_VERSION,
				toolVersion: TOOL_VERSION,
				configHash: this.configHash,
				pluginKeys: this.pluginCacheKeys,
				entries: this.newCacheEntries,
			};
			await writeCache(this.resolvedOutDir, cache);
		}
	}
}
