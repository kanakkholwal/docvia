// biome-ignore assist/source/organizeImports: explicit ordering for clarity
import { parseMarkdown } from "@docvia/core";
import type {
	CompileResult,
	CompilerOptions,
	FileEntry,
	IRDocument,
	PageMeta,
} from "@docvia/ir";
import { docviaError, transformToIR } from "@docvia/ir";
import { PluginRunner } from "@docvia/plugins";
import {
	extractFrontmatter,
	validateFrontmatter,
	zodSchemaToFrontmatterTs,
} from "@docvia/schema";
import { xxh64 } from "@node-rs/xxhash";
import type { Root as HastRoot } from "hast";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
	type CacheFile,
	cacheIsCompatible,
	CACHE_VERSION,
	type CachedEntry,
	readCache,
	writeCache,
} from "./cache";

// Tool version: keep in sync with package.json. Bumped when generated module
// shape changes — invalidates the on-disk cache automatically.
const TOOL_VERSION = "0.1.0";

// ── Hashing ─────────────────────────────────────────────────────────

export interface HashInputs {
	readonly fileContent: string;
	readonly frontmatter: string;
	readonly configHash: string;
	readonly pluginCacheKeys: string[];
	readonly dependencyHashes: string[];
}

export function computeContentHash(inputs: HashInputs): string {
	const composite = [
		inputs.fileContent,
		inputs.frontmatter,
		inputs.configHash,
		...inputs.pluginCacheKeys,
		...inputs.dependencyHashes,
	].join("\0");
	return xxh64(Buffer.from(composite)).toString(36);
}

/**
 * Stable JSON stringify — sorts object keys so config hash is deterministic
 * regardless of property declaration order. Skips function values (plugins
 * are accounted for via pluginCacheKeys instead).
 */
function stableStringify(value: unknown): string {
	if (value === null) return "null";
	if (typeof value === "function") return '"<fn>"';
	if (typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(",")}]`;
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	return `{${keys
		.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
		.join(",")}}`;
}

function hashConfig(config: unknown): string {
	return xxh64(Buffer.from(stableStringify(config))).toString(36);
}

// ── File Reading ────────────────────────────────────────────────────

const FILE_READ_CONCURRENCY = Math.max(4, cpus().length);

async function readFileTree(dir: string): Promise<FileEntry[]> {
	const entries: FileEntry[] = [];
	const dirsToWalk: string[] = [dir];

	// Parallelized BFS — read directories in batches; for each batch, parallel
	// readdir then collect files and queue subdirectories.
	while (dirsToWalk.length > 0) {
		const batch = dirsToWalk.splice(0, FILE_READ_CONCURRENCY);
		const listings = await Promise.all(
			batch.map(async (d) => {
				try {
					return [d, await readdir(d, { withFileTypes: true })] as const;
				} catch (err) {
					throw new docviaError(
						"PARSE_ERROR",
						`Failed to read directory: ${d}`,
						d,
						undefined,
						err as Error,
					);
				}
			}),
		);

		const filePaths: { full: string; rel: string }[] = [];
		for (const [d, items] of listings) {
			for (const item of items) {
				const full = join(d, item.name);
				if (item.isDirectory()) {
					dirsToWalk.push(full);
				} else if (item.isFile() && extname(item.name) === ".md") {
					filePaths.push({
						full,
						rel: relative(dir, full).replace(/\\/g, "/"),
					});
				}
			}
		}

		// Read file contents in parallel
		const reads = await Promise.all(
			filePaths.map(async ({ full, rel }) => {
				const content = await readFile(full, "utf-8");
				const hash = xxh64(Buffer.from(content)).toString(36);
				return { path: full, relativePath: rel, content, hash } as FileEntry;
			}),
		);
		entries.push(...reads);
	}

	return entries;
}

// ── Concurrency ─────────────────────────────────────────────────────

async function compileParallel<T>(
	items: readonly T[],
	fn: (item: T) => Promise<void>,
	concurrency = Math.max(1, cpus().length - 1),
): Promise<void> {
	let index = 0;
	const workers = Array.from(
		{ length: Math.min(concurrency, items.length) || 1 },
		async () => {
			while (true) {
				const i = index++;
				if (i >= items.length) break;
				await fn(items[i] as T);
			}
		},
	);
	await Promise.all(workers);
}

// ── Type generation ─────────────────────────────────────────────────

function toRouteKeyUnion(routes: Record<string, string>): string[] {
	const routeKeys = Object.keys(routes);
	return routeKeys.length > 0
		? routeKeys.map((route) => `  | "${route}"`)
		: ["  | never"];
}

// ── Module Graph Generation ─────────────────────────────────────────

interface CollectionData {
	name: string;
	baseUrl: string;
	routes: Record<string, string>;
	frontmatterTypeDef: string;
}

function generateDynamicTs(
	collections: readonly CollectionData[],
	syntaxConfig: { theme: string; langs: readonly string[] },
	resolvedOutDir: string,
): string {
	const routeMaps = collections
		.map((c) => {
			const entries = Object.entries(c.routes)
				.map(
					([slug, routePath]) =>
						`    ${JSON.stringify(slug)}: ${JSON.stringify(routePath)}`,
				)
				.join(",\n");
			return `  ${JSON.stringify(c.name)}: {\n${entries}\n  }`;
		})
		.join(",\n");

	return `// @ts-nocheck
// Auto-generated by @docvia/compiler — do not edit manually

const routeMap: Record<string, Record<string, string>> = {
${routeMaps}
};

// Absolute path to the docvia outDir, embedded at generation time. The
// filesystem fallback in loadModule() resolves markdown paths against this
// rather than import.meta.url — once this module is bundled (e.g. SvelteKit
// SSR / prerender), import.meta.url points into the build output dir, not
// .docvia/, which would break the relative routeMap paths.
const _DOCVIA_OUT_DIR = ${JSON.stringify(resolvedOutDir)};

// Global Shiki singleton — shared across dynamic.ts, source/node.ts, and renderer adapters.
function _escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
async function _getHighlighter() {
  const g = globalThis;
  if (g.__docvia_shiki__) return g.__docvia_shiki__;
  if (g.__docvia_shiki_pending__) return g.__docvia_shiki_pending__;
  g.__docvia_shiki_pending__ = (async () => {
    try {
      const _m = 'sh' + 'iki';
      const { createHighlighter } = await import(/* @vite-ignore */ /* webpackIgnore: true */ _m);
      const h = await createHighlighter({
        themes: [${JSON.stringify(syntaxConfig.theme)}],
        langs: ${JSON.stringify(syntaxConfig.langs)},
      });
      g.__docvia_shiki__ = {
        highlight: async (code, lang) => {
          try { return { html: h.codeToHtml(code, { lang, theme: ${JSON.stringify(syntaxConfig.theme)} }) }; }
          catch { return { html: '<pre><code>' + _escapeHtml(code) + '</code></pre>' }; }
        },
      };
    } catch {
      g.__docvia_shiki__ = { highlight: async (code) => ({ html: '<pre><code>' + _escapeHtml(code) + '</code></pre>' }) };
    }
    delete g.__docvia_shiki_pending__;
    return g.__docvia_shiki__;
  })();
  return g.__docvia_shiki_pending__;
}

export async function loadModule(
  collection: string,
  slug: string,
): Promise<{ meta: any; content: any; manifest: any } | undefined> {
  const modulePath = routeMap[collection]?.[slug];
  if (!modulePath) return undefined;
  try {
    // Vite: dynamic import goes through ?docvia transform (SSR + client)
    // Next.js/Turbopack: computed string prevents static analysis, falls to catch
    return await import(/* @vite-ignore */ /* webpackIgnore: true */ modulePath);
  } catch {
    // Node.js / Next.js fallback: compile markdown on-the-fly
    if (typeof window !== 'undefined') return undefined;
    // Strip the literal "?docvia" query suffix to recover the file path.
    const cleanPath = modulePath.replace(/\\?docvia$/, '');
    // routeMap paths are relative to the docvia outDir; resolve against its
    // absolute location (not import.meta.url, which moves when bundled).
    const { resolve: _resolvePath } = await import('node:path');
    const resolved = _resolvePath(_DOCVIA_OUT_DIR, cleanPath);
    const hl = await _getHighlighter();
    const { loadMarkdown } = await import('@docvia/source/node');
    return loadMarkdown(resolved, { highlighter: hl });
  }
}

export async function getEagerModules(
  collection: string,
): Promise<Record<string, any> | null> {
  if (typeof window === 'undefined') {
    const slugs = Object.keys(routeMap[collection] ?? {});
    const result: Record<string, any> = {};
    for (const slug of slugs) {
      const mod = await loadModule(collection, slug);
      if (mod) result[slug] = mod;
    }
    return Object.keys(result).length > 0 ? result : null;
  }
  return null;
}
`;
}

function generateRegistryTs(
	resolvedOutDir: string,
	components: Record<
		string,
		{ path: string; hydrate?: boolean; defaultProps?: Record<string, unknown> }
	>,
): string {
	const entries = Object.entries(components);
	const parts: string[] = [
		"// Auto-generated by @docvia/compiler — do not edit manually",
		"import type { ComponentRegistry } from '@docvia/renderer-core';",
	];

	entries.forEach(([, entry], idx) => {
		const resolvedComponentPath = resolve(entry.path);
		const relativePath = relative(
			resolvedOutDir,
			resolvedComponentPath,
		).replace(/\\/g, "/");
		parts.push(`import _Component${idx} from ${JSON.stringify(relativePath)};`);
	});

	const mapEntries = entries
		.map(([name, entry], i) => {
			const { hydrate, defaultProps } = entry;
			const props = defaultProps
				? `, defaultProps: ${JSON.stringify(defaultProps)}`
				: "";
			const hydrateStr = hydrate !== undefined ? `, hydrate: ${hydrate}` : "";
			return `    ${JSON.stringify(name)}: { component: _Component${i}${hydrateStr}${props} }`;
		})
		.join(",\n");

	parts.push(
		"",
		"export const registry: ComponentRegistry = {",
		"  resolve(name: string) {",
		"    const map: Record<string, NonNullable<ReturnType<ComponentRegistry['resolve']>>> = {",
		mapEntries,
		"    };",
		"    return map[name] ?? null;",
		"  },",
		"};",
	);

	return parts.join("\n");
}

function generateSourceTs(
	collections: readonly CollectionData[],
	config: { components?: Record<string, unknown> },
): string {
	const parts: string[] = [
		"// Auto-generated by @docvia/compiler — do not edit manually",
		"import { createCollection, createSource } from '@docvia/source/internal';",
		"import { loadModule, getEagerModules } from './dynamic';",
	];

	const hasRegistry =
		config.components && Object.keys(config.components).length > 0;
	if (hasRegistry) {
		parts.push("export { registry } from './registry';");
	}

	for (const c of collections) {
		const routeKeysLiteral = Object.keys(c.routes)
			.map((k) => JSON.stringify(k))
			.join(", ");
		parts.push(
			"",
			`export const ${c.name} = createCollection<`,
			`  import('./types').${c.name}_Frontmatter,`,
			`  import('./types').${c.name}_RouteKey`,
			`>({`,
			`  name: ${JSON.stringify(c.name)},`,
			`  baseUrl: ${JSON.stringify(c.baseUrl)},`,
			`  routeKeys: [${routeKeysLiteral}] as const,`,
			`  getModule: (slug) => loadModule(${JSON.stringify(c.name)}, slug) as any,`,
			`  getEagerModules: () => getEagerModules(${JSON.stringify(c.name)}),`,
			`  sourceModuleUrl: import.meta.url,`,
			`});`,
		);
	}

	const collectionMap = collections
		.map((c) => `    ${JSON.stringify(c.name)}: ${c.name}`)
		.join(",\n");
	parts.push(
		"",
		"export const docviaSource = createSource({",
		collectionMap,
		"});",
	);

	return parts.join("\n");
}

function generateTypesTs(collections: readonly CollectionData[]): string {
	const parts: string[] = [
		"// Auto-generated by @docvia/compiler — do not edit manually",
	];
	for (const c of collections) {
		const routeKeyUnion = toRouteKeyUnion(c.routes);
		parts.push(
			"",
			`export type ${c.name}_RouteKey =`,
			...routeKeyUnion,
			"  | (string & {});",
			"",
			`export type ${c.name}_Frontmatter = ${c.frontmatterTypeDef};`,
			"",
			`export type ${c.name}_DocPage = import("@docvia/source/runtime").docviaPage<${c.name}_Frontmatter>;`,
		);
	}
	return parts.join("\n");
}

function createdocviaEnvDts(
	collections: readonly CollectionData[],
	relativeOutDir: string,
	hasRegistry: boolean,
): string {
	const exports = collections
		.map((c) => `    export const ${c.name}: typeof source.${c.name};`)
		.join("\n");

	const registryExport = hasRegistry
		? "\n    export const registry: typeof source.registry;"
		: "";
	const registryModule = hasRegistry
		? [
				"",
				"declare module 'docvia/registry' {",
				`    const mod: typeof import('${relativeOutDir}/registry');`,
				"    export const registry: typeof mod.registry;",
				"}",
			].join("\n")
		: "";

	return [
		"declare module 'docvia/source' {",
		`    const source: typeof import('${relativeOutDir}/source');`,
		"    export const docviaSource: typeof source.docviaSource;",
		exports,
		registryExport,
		"}",
		registryModule,
		"",
	].join("\n");
}

// ── Shiki language validation ───────────────────────────────────────

// Cheap structural validation — the actual list of valid Shiki language IDs is
// large and changes between Shiki releases. We catch only the obvious mistakes.
function warnInvalidShikiLangs(langs: readonly string[]): void {
	const seen = new Set<string>();
	for (const lang of langs) {
		if (typeof lang !== "string" || lang.length === 0) {
			console.warn(
				`[docvia] syntax.langs: ignoring non-string entry: ${JSON.stringify(lang)}`,
			);
			continue;
		}
		if (seen.has(lang)) {
			console.warn(`[docvia] syntax.langs: duplicate language "${lang}"`);
		}
		seen.add(lang);
	}
}

// ── Compiler ────────────────────────────────────────────────────────

export async function compile(
	options: CompilerOptions,
): Promise<CompileResult> {
	const startTime = performance.now();
	const { outDir, config } = options;
	const projectRoot = resolve(options.projectRoot ?? process.cwd());
	const resolvedOutDir = resolve(outDir);
	const incremental = options.incremental !== false;

	warnInvalidShikiLangs(config.syntax.langs);

	const collections = config.collections || [
		{ name: "docs", sourceDir: options.sourceDir, baseUrl: "/" },
	];

	const pluginRunner = new PluginRunner(options.plugins);
	const configHash = hashConfig(config);
	const pluginCacheKeys = pluginRunner.getPluginCacheKeys();

	await mkdir(resolvedOutDir, { recursive: true });

	// Load previous cache (if any)
	const prevCache = incremental ? await readCache(resolvedOutDir) : null;
	const cacheCompatible = cacheIsCompatible(
		prevCache,
		TOOL_VERSION,
		configHash,
		pluginCacheKeys,
	);

	const allPages: PageMeta[] = [];
	const collectionData: CollectionData[] = [];
	const newCacheEntries: Record<string, CachedEntry> = {};
	let totalFiles = 0;
	let totalCompiled = 0;
	let totalCached = 0;

	for (const collection of collections) {
		const resolvedSourceDir = resolve(projectRoot, collection.sourceDir);
		const files = await readFileTree(resolvedSourceDir);
		totalFiles += files.length;

		const pages: PageMeta[] = [];
		const routes: Record<string, string> = {};
		const frontmatterSamples: string[] = [];

		await compileParallel(files, async (file) => {
			const cacheKey = `${collection.name}:${file.relativePath}`;
			const prev = cacheCompatible ? prevCache?.entries[cacheKey] : undefined;

			// Cache hit: file content unchanged AND cache is compatible.
			if (prev && prev.fileHash === file.hash) {
				pages.push(prev.page);
				routes[prev.page.slug] = prev.route;
				newCacheEntries[cacheKey] = prev;
				totalCached++;
				return;
			}

			// Cache miss: full pipeline.
			const processedFile = await pluginRunner.runBeforeParse(file);
			const extracted = extractFrontmatter(processedFile.content);
			const frontmatter = validateFrontmatter(
				extracted.data,
				file.path,
				config.frontmatter as never,
			);

			const { ast } = await parseMarkdown(extracted.content, {
				remarkPlugins: config.markdown.remarkPlugins,
			});

			const processedAst = (await pluginRunner.runAfterParse(
				ast,
				processedFile,
			)) as HastRoot;
			const finalAst = (await pluginRunner.runBeforeTransform(
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
				configHash,
				pluginCacheKeys,
				dependencyHashes: [],
			});
			irDoc = { ...irDoc, contentHash };
			irDoc = await pluginRunner.runAfterTransform(irDoc);
			irDoc = await pluginRunner.runBeforeRender(irDoc);

			totalCompiled++;

			const slug = irDoc.slug;
			const relPath = relative(resolvedOutDir, resolve(file.path)).replace(
				/\\/g,
				"/",
			);
			const route = `./${relPath}?docvia`;
			routes[slug] = route;

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
			pages.push(page);
			frontmatterSamples.push(stableStringify(irDoc.frontmatter));

			newCacheEntries[cacheKey] = {
				fileHash: file.hash,
				contentHash,
				page,
				route,
			};
		});

		// Build frontmatter type definition
		let frontmatterTypeDef: string;
		if (config.frontmatter) {
			frontmatterTypeDef = zodSchemaToFrontmatterTs(
				config.frontmatter as never,
			);
		} else {
			const unique = Array.from(new Set(frontmatterSamples));
			frontmatterTypeDef =
				unique.length > 0 ? unique.join(" | ") : "Record<string, unknown>";
		}

		collectionData.push({
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

	// Write the five-file module graph
	const hasRegistry = !!(
		config.components && Object.keys(config.components).length > 0
	);

	await Promise.all([
		writeFile(
			join(resolvedOutDir, "dynamic.ts"),
			generateDynamicTs(collectionData, config.syntax, resolvedOutDir),
		),
		writeFile(
			join(resolvedOutDir, "source.ts"),
			generateSourceTs(collectionData, config),
		),
		writeFile(
			join(resolvedOutDir, "types.d.ts"),
			generateTypesTs(collectionData),
		),
		...(hasRegistry
			? [
					writeFile(
						join(resolvedOutDir, "registry.ts"),
						generateRegistryTs(
							resolvedOutDir,
							config.components as Record<
								string,
								{
									path: string;
									hydrate?: boolean;
									defaultProps?: Record<string, unknown>;
								}
							>,
						),
					),
				]
			: []),
	]);

	// Emit docvia-env.d.ts at the project root (resolved relative to projectRoot)
	const relativeOutDir = relative(projectRoot, resolvedOutDir).replace(
		/\\/g,
		"/",
	);
	const envFilePath = join(projectRoot, "docvia-env.d.ts");
	const envRelativeOutDir = `./${relativeOutDir}`.replace(/\/\/+/g, "/");
	await writeFile(
		envFilePath,
		createdocviaEnvDts(collectionData, envRelativeOutDir, hasRegistry),
	);

	// Persist cache
	if (incremental) {
		const cache: CacheFile = {
			version: CACHE_VERSION,
			toolVersion: TOOL_VERSION,
			configHash,
			pluginKeys: pluginCacheKeys,
			entries: newCacheEntries,
		};
		await writeCache(resolvedOutDir, cache);
	}

	const duration = performance.now() - startTime;

	return {
		pages: allPages,
		searchIndex: "",
		duration,
		stats: {
			total: totalFiles,
			compiled: totalCompiled,
			cached: totalCached,
		},
	};
}

export { computeContentHash as hashContent };
