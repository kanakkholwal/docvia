import { xxh64 } from '@node-rs/xxhash';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { extname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

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
import type { Root as MdastRoot } from 'mdast';

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

// Compiler 

export async function compile(options: CompilerOptions): Promise<CompileResult> {
    const startTime = performance.now();
    const { sourceDir, outDir, renderer, config } = options;
    const resolvedSourceDir = resolve(sourceDir);
    const resolvedOutDir = resolve(outDir);

    // Initialize
    const pluginRunner = new PluginRunner(options.plugins);
    const configHash = xxh64(Buffer.from(JSON.stringify(config))).toString(36);
    const pluginCacheKeys = pluginRunner.getPluginCacheKeys();

    // Step 1: Read file tree
    const files = await readFileTree(resolvedSourceDir);

    // Step 2: Compile each file
    const irDocs: IRDocument[] = [];
    const pages: PageMeta[] = [];

    await compileParallel(files, async (file) => {
        // Plugin: beforeParse
        const processedFile = await pluginRunner.runBeforeParse(file);

        // Extract frontmatter
        const extracted = extractFrontmatter(processedFile.content);
        const frontmatter = validateFrontmatter(extracted.data, file.path);

        // Parse markdown
        const { ast } = await parseMarkdown(extracted.content, {
            remarkPlugins: config.markdown.remarkPlugins,
        });

        // Plugin: afterParse
        const processedAst = (await pluginRunner.runAfterParse(ast, processedFile)) as MdastRoot;

        // Plugin: beforeTransform
        const finalAst = (await pluginRunner.runBeforeTransform(processedAst, frontmatter)) as MdastRoot;

        // Transform to IR
        let irDoc = transformToIR(finalAst, frontmatter, file.relativePath);

        // Compute content hash
        const contentHash = computeContentHash({
            fileContent: file.hash,
            frontmatter: JSON.stringify(frontmatter),
            configHash,
            pluginCacheKeys,
            dependencyHashes: [],
        });

        irDoc = { ...irDoc, contentHash };

        // Plugin: afterTransform
        irDoc = await pluginRunner.runAfterTransform(irDoc);

        // Plugin: beforeRender
        irDoc = await pluginRunner.runBeforeRender(irDoc);

        irDocs.push(irDoc);
    });

    // Step 3: Process assets
    await mkdir(join(resolvedOutDir, 'assets'), { recursive: true });
    await mkdir(join(resolvedOutDir, 'pages'), { recursive: true });

    // Step 4: Render pages
    for (const doc of irDocs) {
        const rendered = await renderer.renderPage(doc);

        // Write content-addressable output
        const outPath = join(resolvedOutDir, 'pages', `${doc.slug}.${doc.contentHash}.js`);
        await writeFile(outPath, rendered.code, 'utf-8');

        // Process assets for this document
        const assets = await processAssets(doc, resolvedOutDir);
        for (const asset of assets) {
            try {
                const srcBuffer = await readFile(asset.originalPath);
                await writeFile(asset.emittedPath, srcBuffer);
            } catch {
                // Already warned during processAssets
            }
        }

        pages.push({
            slug: doc.slug,
            title: doc.frontmatter.title,
            description: doc.frontmatter.description,
            headings: doc.headings,
            contentHash: doc.contentHash,
            lastModified: Date.now(),
            tags: doc.frontmatter.tags,
            order: doc.frontmatter.order,
        });
    }

    // Step 6: Build search index
    const searchIndexer = await createSearchIndexer();
    await searchIndexer.buildIndex(irDocs);
    const searchJson = await searchIndexer.exportIndex();
    const searchPath = join(resolvedOutDir, 'search.json');
    await writeFile(searchPath, searchJson, 'utf-8');

    // Step 7: Write manifest
    const manifest = await renderer.renderManifest(pages);
    await writeFile(join(resolvedOutDir, 'manifest.json'), manifest, 'utf-8');

    // Step 8: Write page metadata
    await writeFile(
        join(resolvedOutDir, 'meta.json'),
        JSON.stringify(pages, null, 2),
        'utf-8',
    );

    // Step 9: Write routes.ts
    const routesContent = [
        'export const routes: Record<string, () => Promise<any>> = {',
        ...pages.map((p) => `  '${p.slug}': () => import('./pages/${p.slug}.${p.contentHash}.js'),`),
        '};',
    ].join('\n');
    await writeFile(join(resolvedOutDir, 'routes.ts'), routesContent, 'utf-8');

    // Step 10: Write source.ts
    const sourceContent = [
        "import { routes } from './routes';",
        "import meta from './meta.json';",
        "",
        "export const dockitSource = {",
        "  routes,",
        "  meta as any",
        "};",
    ].join('\n');
    await writeFile(join(resolvedOutDir, 'source.ts'), sourceContent, 'utf-8');

    const duration = performance.now() - startTime;

    return {
        pages,
        searchIndex: searchPath,
        duration,
        stats: {
            total: files.length,
            compiled: irDocs.length,
            cached: 0,
        },
    };
}

export { computeContentHash as hashContent };

