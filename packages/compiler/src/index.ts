// biome-ignore assist/source/organizeImports: no need
import { parseMarkdown } from '@dockit/core';
import type {
    CompileResult,
    CompilerOptions,
    FileEntry,
    IRDocument,
    PageMeta
} from '@dockit/ir';
import { transformToIR } from '@dockit/ir';
import { PluginRunner } from '@dockit/plugins';
import { extractFrontmatter, validateFrontmatter } from '@dockit/schema';
import { createSearchIndexer } from '@dockit/search';
import { xxh64 } from '@node-rs/xxhash';
import type { Root as MdastRoot } from 'mdast';
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
    const queue = [...items];
    const workers = Array.from(
        { length: Math.min(concurrency, queue.length) },
        async () => {
            while (queue.length > 0) {
                const item = queue.shift()!;
                await fn(item);
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
            });
        } catch {
            // Asset not found — skip with warning
            console.warn(`[dockit] Asset not found: ${dep.path}`);
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

function createDockitEnvDts(collections: readonly { name: string }[], relativeOutDir: string): string {
    const collectionLines = collections.map((collection) => {
        const typesPath = `./${[relativeOutDir, 'collections', collection.name, 'types'].filter(Boolean).join('/')}`;
        return `            ${collection.name}: DockitCollection<import('${typesPath}').Frontmatter, import('${typesPath}').RouteKey>;`;
    });

    const exportLines = collections.map(
        (collection) => `    export const ${collection.name}: typeof dockitSource.collections.${collection.name};`,
    );

    return [
        "declare module 'dockit:source' {",
        "    import type { DockitCollection } from '@dockit/source/runtime';",
        '',
        '    export const dockitSource: {',
        '        collections: {',
        ...collectionLines,
        '        };',
        '    };',
        '',
        ...exportLines,
        '}',
        '',
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

            const processedAst = (await pluginRunner.runAfterParse(ast, processedFile)) as MdastRoot;
            const finalAst = (await pluginRunner.runBeforeTransform(processedAst, frontmatter)) as MdastRoot;

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
            // Virtual route for dockit:source
            routes[slug] = `/${relative(process.cwd(), file.path).replace(/\\/g, '/')}?dockit`;

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

            // Process assets for this document
            const assets = await processAssets(irDoc, resolvedOutDir);
            for (const asset of assets) {
                try {
                    const srcBuffer = await readFile(asset.originalPath);
                    await writeFile(asset.emittedPath, srcBuffer);
                } catch {
                    // Already warned during processAssets
                }
            }
        });

        // Step 3: Write collection metadata
        await writeFile(join(collectionOutDir, 'meta.json'), JSON.stringify(pages, null, 2));

        // Navigation (Tree)
        const nav = buildNavTree(pages);
        await writeFile(join(collectionOutDir, 'nav.json'), JSON.stringify(nav, null, 2));

        // Tags
        await writeFile(join(collectionOutDir, 'tags.json'), JSON.stringify(tags, null, 2));

        // Routes
        const routesTs = [
            `export const routes = ${JSON.stringify(routes, null, 2)} as const;`,
            '',
            'export type RouteKey = keyof typeof routes;',
        ].join('\n');
        await writeFile(join(collectionOutDir, 'routes.ts'), routesTs);

        // Types
        const typesDts = [
            'export type RouteKey =',
            ...toRouteKeyUnion(routes),
            '  | (string & {});',
            '',
            'export interface Frontmatter {',
            '  title: string;',
            '  description?: string;',
            '  slug?: string;',
            '  tags?: string[];',
            '  draft?: boolean;',
            '  order?: number;',
            '  [key: string]: unknown;',
            '}',
        ].join('\n');
        await writeFile(join(collectionOutDir, 'types.d.ts'), typesDts);

        // Search index for this collection
        const searchIndexer = await createSearchIndexer();
        await searchIndexer.buildIndex(irDocs);
        const searchJson = await searchIndexer.exportIndex();
        await writeFile(join(collectionOutDir, 'search.json'), searchJson);

        allPages.push(...pages);
    }

    const projectRoot = process.cwd();
    const relativeOutDir = relative(projectRoot, resolvedOutDir).replace(/\\/g, '/');
    await writeFile(
        join(projectRoot, 'dockit-env.d.ts'),
        createDockitEnvDts(collections, relativeOutDir),
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

function buildNavTree(pages: PageMeta[]) {
    const tree: any[] = [];
    const sorted = [...pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const page of sorted) {
        const parts = page.slug.split('/');
        let current = tree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]!;
            let node = current.find((n: any) => n.name === part);

            if (!node) {
                node = { name: part, children: [] };
                current.push(node);
            }

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

