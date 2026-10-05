import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { performance } from "node:perf_hooks";
import type {
	CompileResult,
	CompilerOptions,
	docviaConfig,
	IRDocument,
	PageMeta,
} from "@docvia/ir";
import { toPageMeta } from "@docvia/ir";
import {
	assertCollectionDirs,
	assertComponentsExist,
	locate,
} from "./collections";
import {
	type CollectionData,
	emitModuleGraphFiles,
	warnInvalidShikiLangs,
	emitTypeDeclarations as writeTypeDeclarations,
} from "./emit";
import { compileParallel } from "./fs";
import { PagePipeline } from "./pages";
import { samePath } from "./paths";
import { scanPages } from "./scan";
import { collectionTypeData } from "./type-data";

/** In-memory record for one compiled document. */
export interface ServiceEntry {
	readonly collectionName: string;
	readonly relativePath: string;
	readonly filePath: string;
	readonly meta: Record<string, unknown> & { readonly slug: string };
	readonly page: PageMeta;
	readonly ir: IRDocument;
}

/** Outcome of an `invalidate()` call. */
export interface InvalidationResult {
	readonly changed: ReadonlyArray<{
		readonly collection: string;
		readonly slug: string;
		readonly contentHash: string;
	}>;
	/** A slug appeared, disappeared or moved: regenerate the route index. */
	readonly routeMapChanged: boolean;
}

/**
 * Batch compiler for hosts that need everything up front (the CLI, Next.js, search indexing).
 * Vite apps don't use it: they compile pages on demand through {@link PagePipeline}.
 */
export class CompileService {
	readonly config: docviaConfig;
	readonly pipeline: PagePipeline;
	private readonly projectRoot: string;
	private readonly resolvedOutDir: string;
	private readonly configPath?: string;
	private readonly entries = new Map<string, ServiceEntry>();

	constructor(options: CompilerOptions) {
		this.config = options.config;
		this.projectRoot = resolvePath(options.projectRoot ?? process.cwd());
		this.resolvedOutDir = resolvePath(this.projectRoot, options.outDir);
		this.configPath = options.configPath
			? resolvePath(options.configPath)
			: undefined;
		this.pipeline = new PagePipeline(
			{
				...options.config,
				sourceDir: options.sourceDir,
				plugins: options.plugins,
			},
			this.projectRoot,
		);
	}

	/** Absolute output directory for generated files. */
	get outDir(): string {
		return this.resolvedOutDir;
	}

	/** Absolute source directory of every collection, for file watchers. */
	collectionDirs(): string[] {
		return this.pipeline.collections.map((c) => c.dir);
	}

	/** True when `filePath` is a markdown file inside one of the collections. */
	owns(filePath: string): boolean {
		return (
			filePath.endsWith(".md") &&
			locate(this.pipeline.collections, resolvePath(filePath)) !== undefined
		);
	}

	private async compileEntry(
		collection: string,
		absPath: string,
		relativePath: string,
		code: string,
	): Promise<ServiceEntry> {
		const [meta, ir] = await Promise.all([
			this.pipeline.meta(absPath, code, collection),
			this.pipeline.document(absPath, code, collection),
		]);
		const entry: ServiceEntry = {
			collectionName: collection,
			relativePath,
			filePath: absPath,
			meta,
			page: toPageMeta(ir),
			ir,
		};
		this.entries.set(absPath, entry);
		return entry;
	}

	/** Compile every page of every collection. */
	async compileAll(): Promise<CompileResult> {
		const start = performance.now();
		warnInvalidShikiLangs(this.config.syntax.langs);
		assertComponentsExist(this.config, this.projectRoot);
		assertCollectionDirs(this.pipeline.collections);
		this.entries.clear();

		const scanned = await scanPages(this.pipeline);
		await compileParallel(scanned, async (p) => {
			await this.compileEntry(
				p.collection.name,
				p.absPath,
				p.relativePath,
				await readFile(p.absPath, "utf-8"),
			);
		});
		const pages = [...this.entries.values()].map((e) => e.page);
		return {
			pages,
			duration: performance.now() - start,
			stats: { total: pages.length, compiled: pages.length, cached: 0 },
		};
	}

	/** Recompile changed files and drop deleted ones. */
	async invalidate(filePaths: readonly string[]): Promise<InvalidationResult> {
		const changed: Array<{
			collection: string;
			slug: string;
			contentHash: string;
		}> = [];
		let routeMapChanged = false;
		for (const raw of filePaths) {
			const absPath = resolvePath(raw);
			const match = locate(this.pipeline.collections, absPath);
			if (!match) continue;
			const key = [...this.entries.keys()].find((k) => samePath(k, absPath));
			const existing = key ? this.entries.get(key) : undefined;
			if (!existsSync(absPath)) {
				if (key) {
					this.entries.delete(key);
					routeMapChanged = true;
				}
				continue;
			}
			if (key && key !== absPath) this.entries.delete(key);
			const entry = await this.compileEntry(
				match.collection.name,
				absPath,
				match.relativePath,
				await readFile(absPath, "utf-8"),
			);
			if (!existing || existing.meta.slug !== entry.meta.slug)
				routeMapChanged = true;
			changed.push({
				collection: match.collection.name,
				slug: entry.meta.slug,
				contentHash: entry.ir.contentHash,
			});
		}
		return { changed, routeMapChanged };
	}

	/** A compiled document by collection and slug. */
	async getDocument(
		collectionName: string,
		slug: string,
	): Promise<IRDocument | undefined> {
		for (const e of this.entries.values()) {
			if (e.collectionName === collectionName && e.meta.slug === slug)
				return e.ir;
		}
		return undefined;
	}

	/** Every compiled document, optionally for one collection. Call after `compileAll()`. */
	async getDocuments(
		collectionName?: string,
	): Promise<Array<{ collection: string; document: IRDocument }>> {
		return [...this.entries.values()]
			.filter((e) => !collectionName || e.collectionName === collectionName)
			.map((e) => ({ collection: e.collectionName, document: e.ir }));
	}

	/** Route slugs and frontmatter types per collection. */
	getCollectionData(): CollectionData[] {
		return collectionTypeData(
			this.pipeline.collections,
			[...this.entries.values()].map((e) => ({
				collection: e.collectionName,
				meta: e.meta,
			})),
			this.resolvedOutDir,
			this.configPath,
		);
	}

	/** Write `.docvia/types.d.ts` and `.docvia/env.d.ts`. */
	async emitTypeDeclarations(): Promise<void> {
		await writeTypeDeclarations({
			outDir: this.resolvedOutDir,
			projectRoot: this.projectRoot,
			config: this.config,
			collections: this.getCollectionData(),
		});
	}

	/** Write the disk module graph used by non-Vite hosts. */
	async emitDiskModuleGraph(): Promise<void> {
		await emitModuleGraphFiles({
			outDir: this.resolvedOutDir,
			projectRoot: this.projectRoot,
			config: this.config,
			collections: this.getCollectionData(),
			pages: [...this.entries.values()].map((e) => ({
				collection: e.collectionName,
				absPath: e.filePath,
				meta: e.meta,
			})),
		});
	}
}
