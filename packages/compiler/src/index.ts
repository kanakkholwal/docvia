// biome-ignore assist/source/organizeImports: no need
import { parseMarkdown } from '@docvia/core';
import type {
    CompileResult,
    CompilerOptions,
    FileEntry,
    IRDocument,
    PageMeta
} from '@docvia/ir';
import { transformToIR } from '@docvia/ir';
import { PluginRunner } from '@docvia/plugins';
import { extractFrontmatter, validateFrontmatter } from '@docvia/schema';
import { createSearchIndexer } from '@docvia/search';
import { xxh64 } from '@node-rs/xxhash';
import type { Root as HastRoot } from 'hast';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { extname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

// Hashing

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
    ].join('\0');
    return xxh64(Buffer.from(composite)).toString(36);
}

// File Reading

async function readFileTree(dir: string): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];

    async function walk(dir: string) {
        const items = await readdir(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = join(dir, item.name);
            if (item.isDirectory()) {
                await walk(fullPath);
            } else if (item.isFile() && extname(item.name) === '.md') {
                const content = await readFile(fullPath, 'utf-8');
                const hash = xxh64(Buffer.from(content)).toString(36);
                entries.push({
                    path: fullPath,
                    relativePath: relative(dir, fullPath).replace(/\\/g, '/'),
                    content,
                    hash,
                });
            }
        }
    }

    await walk(dir);
    return entries;
}

// Parallelism

async function compileParallel<T>(
    items: readonly T[],
    fn: (item: T) => Promise<void>,
    concurrency = Math.max(1, cpus().length - 1),
): Promise<void> {
    let index = 0;
    const workers = Array.from(
        { length: Math.min(concurrency, items.length) },
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

// Asset Pipeline

interface AssetEmission {
    readonly originalPath: string;
    readonly emittedFilename: string;
    readonly emittedPath: string;
    readonly hash: string;
    readonly buffer: Buffer;
}

async function processAssets(
    doc: IRDocument,
    outDir: string,
): Promise<AssetEmission[]> {
    const assetDeps = doc.dependencies.filter((d) => d.type === 'asset');
    const emissions: AssetEmission[] = [];

    for (const dep of assetDeps) {
        try {
            const buffer = await readFile(dep.path);
            const hash = xxh64(buffer).toString(36).slice(0, 8);
            const ext = extname(dep.path);
            const base = dep.path.split('/').pop()?.replace(ext, '') ?? 'asset';
            const emittedFilename = `${base}.${hash}${ext}`;
            emissions.push({
                originalPath: dep.path,
                emittedFilename,
                emittedPath: join(outDir, 'assets', emittedFilename),
                hash,
                buffer,
            });
        } catch {
            // Asset not found — skip with warning
            console.warn(`[docvia] Asset not found: ${dep.path}`);
        }
    }

    return emissions;
}

function toRouteKeyUnion(routes: Record<string, string>): string[] {
    const routeKeys = Object.keys(routes);
    return routeKeys.length > 0
        ? routeKeys.map((route) => `  | "${route}"`)
        : ['  | never'];
}

function createdocviaEnvDts(collections: readonly { name: string }[], relativeOutDir: string, hasRegistry: boolean): string {
    const exports = collections.map(c => `    export const ${c.name}: typeof source.${c.name};`).join('\n');
    const registryModule = hasRegistry ? [
        "",
        "declare module 'docvia:source/registry' {",
        `    const registry: import('${relativeOutDir}/registry').registry;`,
        `    export { registry };`,
        "}",
    ].join('\n') : '';
    return [
        "declare module 'docvia:source' {",
        `    const source: typeof import('${relativeOutDir}/source');`,
        '    export const docviaSource: typeof source.docviaSource;',
        exports,
        "}",
        registryModule,
        "",
    ].join('\n');
}

function generateRegistryTs(components: Record<string, { path: string; hydrate?: boolean; defaultProps?: Record<string, unknown> }>): string {
    const entries = Object.entries(components);
    const imports = entries.map(([, entry], i) =>
        `import _Component${i} from ${JSON.stringify(entry.path)};`
    ).join('\n');

    const mapEntries = entries.map(([name, entry], i) => {
        const { hydrate, defaultProps } = entry;
        const props = defaultProps ? `, defaultProps: ${JSON.stringify(defaultProps)}` : '';
        const hydrateStr = hydrate !== undefined ? `, hydrate: ${hydrate}` : '';
        return `  ${JSON.stringify(name)}: { component: _Component${i}${hydrateStr}${props} }`;
    }).join(',\n');

    return [
        '// Auto-generated by @docvia/compiler — do not edit manually',
        imports,
        '',
        'export const registry = {',
        '  resolve(name) {',
        '    const map = {',
        mapEntries,
        '    };',
        '    return map[name] ?? null;',
        '  },',
        '};',
        '',
    ].join('\n');
}

function generateSourceTs(collections: readonly { name: string }[]): string {
    const imports = collections.map((c, i) => [
        `import * as routes_${i} from './collections/${c.name}/routes';`,
        `import meta_${i} from './collections/${c.name}/meta.json';`,
        `import nav_${i} from './collections/${c.name}/nav.json';`,
        `import tags_${i} from './collections/${c.name}/tags.json';`,
    ].join('\n')).join('\n');

    const inits = collections.map((c, i) => `
export const ${c.name} = createCollection<import('./collections/${c.name}/types').Frontmatter>({
  name: ${JSON.stringify(c.name)},
  baseUrl: ${JSON.stringify(`/${c.name === 'docs' ? '' : c.name}`.replace(/\/+/g, '/'))},
  routes: routes_${i}.routes,
  meta: meta_${i} as any,
  nav: nav_${i},
  tags: tags_${i} as any
});`).join('\n');

    const collectionMap = collections.map(c => `    ${JSON.stringify(c.name)}: ${c.name}`).join(',\n');

    return [
        "import { createCollection, createSource } from '@docvia/source/internal';",
        imports,
        inits,
        "",
        "export const docviaSource = createSource({",
        collectionMap,
        "});",
    ].join('\n');
}

// Compiler 

export async function compile(options: CompilerOptions): Promise<CompileResult> {
    const startTime = performance.now();
    const { outDir, config } = options;
    const resolvedOutDir = resolve(outDir);

    const collections = config.collections || [
        { name: 'docs', sourceDir: options.sourceDir, baseUrl: '/' }
    ];

    const pluginRunner = new PluginRunner(options.plugins);
    const configHash = xxh64(Buffer.from(JSON.stringify(config))).toString(36);
    const pluginCacheKeys = pluginRunner.getPluginCacheKeys();

    const allPages: PageMeta[] = [];
    let totalFiles = 0;
    let totalCompiled = 0;

    for (const collection of collections) {
        const resolvedSourceDir = resolve(collection.sourceDir);
        const collectionOutDir = join(resolvedOutDir, 'collections', collection.name);
        const assetsOutDir = join(resolvedOutDir, 'assets');
        await mkdir(collectionOutDir, { recursive: true });
        await mkdir(assetsOutDir, { recursive: true });

        // Step 1: Read file tree
        const files = await readFileTree(resolvedSourceDir);
        totalFiles += files.length;

        // Step 2: Compile each file
        const irDocs: IRDocument[] = [];
        const pages: PageMeta[] = [];
        const routes: Record<string, string> = {};
        const tags: Record<string, string[]> = {};

        await compileParallel(files, async (file) => {
            const processedFile = await pluginRunner.runBeforeParse(file);
            const extracted = extractFrontmatter(processedFile.content);
            const frontmatter = validateFrontmatter(extracted.data, file.path);

            const { ast } = await parseMarkdown(extracted.content, {
                remarkPlugins: config.markdown.remarkPlugins,
            });

            const processedAst = (await pluginRunner.runAfterParse(ast, processedFile)) as HastRoot;
            const finalAst = (await pluginRunner.runBeforeTransform(processedAst, frontmatter)) as HastRoot;

            let irDoc = transformToIR(finalAst, frontmatter, file.relativePath);
            const contentHash = computeContentHash({
                fileContent: file.hash,
                frontmatter: JSON.stringify(frontmatter),
                configHash,
                pluginCacheKeys,
                dependencyHashes: [],
            });

            irDoc = { ...irDoc, contentHash };
            irDoc = await pluginRunner.runAfterTransform(irDoc);
            irDoc = await pluginRunner.runBeforeRender(irDoc);

            irDocs.push(irDoc);
            totalCompiled++;

            const slug = irDoc.slug;
            // Virtual route for docvia:source
            routes[slug] = `/${relative(process.cwd(), file.path).replace(/\\/g, '/')}?docvia`;

            // Track tags
            if (irDoc.frontmatter.tags) {
                for (const tag of irDoc.frontmatter.tags) {
                    if (!tags[tag]) tags[tag] = [];
                    tags[tag].push(slug);
                }
            }

            pages.push({
                slug,
                title: irDoc.frontmatter.title,
                description: irDoc.frontmatter.description,
                headings: irDoc.headings,
                contentHash,
                lastModified: Date.now(),
                tags: irDoc.frontmatter.tags || [],
                order: irDoc.frontmatter.order,
            });

            // Process assets for this document — buffer already read inside processAssets
            const assets = await processAssets(irDoc, resolvedOutDir);
            for (const asset of assets) {
                try {
                    await writeFile(asset.emittedPath, asset.buffer);
                } catch {
                    // Already warned during processAssets
                }
            }
        });

        // Step 3: Write collection metadata — all files are independent, write in parallel
        const nav = buildNavTree(pages);

        const routesTs = [
            `export const routes = ${JSON.stringify(routes, null, 2)} as const;`,
            '',
            'export type RouteKey = keyof typeof routes;',
        ].join('\n');

        const uniqueFrontmatters = Array.from(new Set(irDocs.map(doc => JSON.stringify(doc.frontmatter))));
        const frontmatterUnion = uniqueFrontmatters.length > 0
            ? uniqueFrontmatters.map(f => `  | ${f}`).join('\n')
            : '  | Record<string, unknown>';

        const typesDts = [
            'export type RouteKey =',
            ...toRouteKeyUnion(routes),
            '  | (string & {});',
            '',
            'export type Frontmatter = ',
            frontmatterUnion + ';',
            '',
            'export type DocPage = import("@docvia/source/runtime").docviaPage<Frontmatter>;',
        ].join('\n');

        const searchIndexer = await createSearchIndexer();
        await searchIndexer.buildIndex(irDocs);
        const searchJson = await searchIndexer.exportIndex();

        await Promise.all([
            writeFile(join(collectionOutDir, 'meta.json'), JSON.stringify(pages, null, 2)),
            writeFile(join(collectionOutDir, 'nav.json'), JSON.stringify(nav, null, 2)),
            writeFile(join(collectionOutDir, 'tags.json'), JSON.stringify(tags, null, 2)),
            writeFile(join(collectionOutDir, 'routes.ts'), routesTs),
            writeFile(join(collectionOutDir, 'types.d.ts'), typesDts),
            writeFile(join(collectionOutDir, 'search.json'), searchJson),
        ]);

        allPages.push(...pages);
    }

    const projectRoot = process.cwd();
    const relativeOutDir = relative(projectRoot, resolvedOutDir).replace(/\\/g, '/');

    // Emit source.ts
    await writeFile(
        join(resolvedOutDir, 'source.ts'),
        generateSourceTs(collections)
    );

    // Emit registry.ts if components are configured
    if (config.components && Object.keys(config.components).length > 0) {
        // Normalize component paths to be relative to the outDir
        const normalizedComponents = Object.fromEntries(
            Object.entries(config.components).map(([name, comp]: [string, any]) => {
                const resolvedComponentPath = resolve(comp.path);
                const relativePath = relative(resolvedOutDir, resolvedComponentPath).replace(/\\/g, '/');
                return [name, { ...comp, path: relativePath }];
            })
        );

        await writeFile(
            join(resolvedOutDir, 'registry.ts'),
            generateRegistryTs(normalizedComponents as Record<string, { path: string; hydrate?: boolean; defaultProps?: Record<string, unknown> }>)
        );
    }

    // Emit docvia-env.d.ts - put it in project root for better reliable resolution
    const envFilePath = join(projectRoot, 'docvia-env.d.ts');
    const envRelativeOutDir = `./${relativeOutDir}`;

    await writeFile(
        envFilePath,
        createdocviaEnvDts(
            collections,
            envRelativeOutDir.replace(/\/\/+/g, '/'),
            !!(config.components && Object.keys(config.components).length > 0),
        ),
    );

    const duration = performance.now() - startTime;

    return {
        pages: allPages,
        searchIndex: join(resolvedOutDir, 'collections'), // Root of search indices
        duration,
        stats: {
            total: totalFiles,
            compiled: totalCompiled,
            cached: 0,
        },
    };
}

interface NavNode {
    name: string;
    children: NavNode[];
    slug?: string;
    title?: string;
}

function buildNavTree(pages: PageMeta[]): NavNode[] {
    const tree: NavNode[] = [];
    // Each level gets its own name→node Map for O(1) child lookup
    const levelMaps: Map<NavNode[], Map<string, NavNode>> = new Map();
    const sorted = [...pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const getOrCreateNode = (list: NavNode[], name: string): NavNode => {
        let map = levelMaps.get(list);
        if (!map) {
            map = new Map();
            levelMaps.set(list, map);
        }
        let node = map.get(name);
        if (!node) {
            node = { name, children: [] };
            list.push(node);
            map.set(name, node);
        }
        return node;
    };

    for (const page of sorted) {
        const parts = page.slug.split('/');
        let current = tree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i] as string;
            const node = getOrCreateNode(current, part);

            if (i === parts.length - 1) {
                node.slug = page.slug;
                node.title = page.title;
            }

            current = node.children;
        }
    }
    return tree;
}

export { computeContentHash as hashContent };

