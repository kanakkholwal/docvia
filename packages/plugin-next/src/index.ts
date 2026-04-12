import type { docviaConfig } from '@docvia/ir';
import type { NextConfig } from 'next';
import { closeSync, existsSync, openSync, rmSync } from 'node:fs';
import { relative, resolve } from 'node:path';

export interface DocviaNextOptions {
    /** Path to docvia.config.ts relative to project root (default: './docvia.config.ts') */
    configPath?: string;
}

const logger = {
    info(msg: string) { console.log(`\x1b[36m[docvia]\x1b[0m ${msg}`); },
    success(msg: string) { console.log(`\x1b[32m[docvia]\x1b[0m ${msg}`); },
    warn(msg: string) { console.warn(`\x1b[33m[docvia]\x1b[0m ${msg}`); },
    error(msg: string, err?: unknown) { console.error(`\x1b[31m[docvia]\x1b[0m ${msg}`); if (err) console.error(err); },
};

let _initPromise: Promise<docviaConfig | null> | null = null;
let _watcherCleanup: (() => void) | null = null;

function findTurbopackRoot(startDir: string): string {
    let currentDir = startDir;

    while (true) {
        if (
            existsSync(resolve(currentDir, 'pnpm-lock.yaml'))
            || existsSync(resolve(currentDir, 'package-lock.json'))
            || existsSync(resolve(currentDir, 'yarn.lock'))
            || existsSync(resolve(currentDir, 'bun.lock'))
            || existsSync(resolve(currentDir, 'bun.lockb'))
        ) {
            return currentDir;
        }

        const parentDir = resolve(currentDir, '..');
        if (parentDir === currentDir) {
            return startDir;
        }

        currentDir = parentDir;
    }
}

function toTurbopackAliasPath(filePath: string, rootDir: string): string {
    const normalizedRelativePath = relative(rootDir, filePath).replace(/\\/g, '/');

    if (normalizedRelativePath.startsWith('.')) {
        return normalizedRelativePath;
    }

    if (!normalizedRelativePath.startsWith('..')) {
        return `./${normalizedRelativePath}`;
    }

    return filePath.replace(/\\/g, '/');
}

function acquireFileLock(dir: string): boolean {
    const lockPath = resolve(dir, '.docvia-build.lock');
    try {
        const fd = openSync(lockPath, 'wx');
        closeSync(fd);
        const cleanup = () => {
            try { rmSync(lockPath, { force: true }); } catch { /* ignore */ }
        };
        process.on('exit', cleanup);
        process.on('SIGINT', () => { cleanup(); process.exit(); });
        process.on('SIGTERM', () => { cleanup(); process.exit(); });
        return true;
    } catch {
        return false;
    }
}

/**
 * Create a Next.js config wrapper that integrates docvia's compilation,
 * file-watching, and module resolution directly into the Next.js lifecycle.
 */
export function withDocvia(options: DocviaNextOptions = {}) {
    const isDev = process.env.NODE_ENV !== 'production';

    return function withDocviaConfig(nextConfig: NextConfig | ((phase: string, context: any) => NextConfig | Promise<NextConfig>) = {}): any {
        return async (phase: string, context: any) => {
            if (!_initPromise) {
                _initPromise = init(isDev, options);
            }
            
            const docviaConfigInfo = await _initPromise;
            const resolvedConfig = typeof nextConfig === 'function' ? await nextConfig(phase, context) : nextConfig;
            const outDir = docviaConfigInfo ? resolve(docviaConfigInfo.outDir ?? '.docvia') : resolve('.docvia');
            const sourceAlias = resolve(outDir, 'source.ts');
            const registryAlias = resolve(outDir, 'registry.ts');

            return {
                ...resolvedConfig,
                webpack(config: any, webpackOptions: any) {
                    config.resolve = config.resolve || {};
                    config.resolve.alias = config.resolve.alias || {};
                    config.resolve.alias['docvia/source'] = sourceAlias;
                    config.resolve.alias['docvia/registry'] = registryAlias;

                    return resolvedConfig.webpack?.(config, webpackOptions) ?? config;
                },
            };
        };
    };
}

async function init(dev: boolean, options: DocviaNextOptions): Promise<docviaConfig | null> {
    const { compile } = await import('@docvia/compiler');
    const { loadConfig, defineConfig } = await import('@docvia/plugins');
    const { docviaError } = await import('@docvia/ir');

    const configPath = resolve(options.configPath ?? './docvia.config.ts');
    let config: docviaConfig;
    if (existsSync(configPath)) {
        config = await loadConfig(configPath);
    } else {
        config = defineConfig({});
    }

    const sourceDir = resolve(config.sourceDir ?? 'docs');
    const outDir = resolve(config.outDir ?? '.docvia');
    const renderer = config.renderer;

    if (!renderer) {
        logger.warn('No renderer configured in docvia.config.ts — skipping compilation.');
        return config;
    }

    if (!existsSync(sourceDir)) {
        logger.warn(`Source directory not found: ${sourceDir}`);
        return config;
    }

    if (!acquireFileLock(process.cwd())) {
        logger.info('Build already running in another process (file-lock detected), skipping start.');
        return config; // Handled by another next worker
    }

    try {
        logger.info('Compiling documentation...');
        const result = await compile({
            sourceDir,
            outDir,
            renderer,
            plugins: [...(config.plugins ?? [])],
            config,
        });
        logger.success(`Built ${result.stats.total} files in ${Math.round(result.duration)}ms`);
    } catch (err) {
        if (err instanceof docviaError) {
            logger.error(`Build failed: [${err.code}] ${err.message}`, err.file ? ` → ${err.file}` : undefined);
        } else {
            logger.error('Build failed', err);
        }
        if (!dev) {
            throw err;
        }
    }

    if (dev) {
        await startDevWatcher(sourceDir, outDir, renderer, config);
    }
    
    return config;
}

async function startDevWatcher(
    sourceDir: string,
    outDir: string,
    renderer: NonNullable<docviaConfig['renderer']>,
    config: docviaConfig,
): Promise<void> {
    if (_watcherCleanup) return; // singleton

    const { compile } = await import('@docvia/compiler');
    const { docviaError } = await import('@docvia/ir');
    const { watch } = await import('chokidar');

    let pending = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isRebuilding = false;
    let rebuildQueued = false;

    const watcher = watch(sourceDir, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
    });

    _watcherCleanup = () => {
        logger.info('Closing file watcher');
        void watcher.close();
        _watcherCleanup = null;
    };
    
    process.on('exit', _watcherCleanup);
    process.on('SIGINT', () => { if (_watcherCleanup) _watcherCleanup(); process.exit(); });
    process.on('SIGTERM', () => { if (_watcherCleanup) _watcherCleanup(); process.exit(); });

    function flush() {
        if (pending.size === 0) return;
        if (isRebuilding) {
            rebuildQueued = true;
            return;
        }
        
        const count = pending.size;
        pending.clear();
        timer = null;
        isRebuilding = true;
        rebuildQueued = false;

        logger.info(`Rebuilding (${count} file(s) changed)...`);
        
        compile({
            sourceDir,
            outDir,
            renderer,
            plugins: [...(config.plugins ?? [])],
            config,
        })
            .then((r) => {
                logger.success(`Rebuilt in ${Math.round(r.duration)}ms`);
            })
            .catch((err: unknown) => {
                if (err instanceof docviaError) {
                    logger.error(`Rebuild failed: [${err.code}] ${err.message}`);
                } else {
                    logger.error('Rebuild error:', err);
                }
            })
            .finally(() => {
                isRebuilding = false;
                if (rebuildQueued || pending.size > 0) {
                    flush();
                }
            });
    }

    function schedule(filePath: string) {
        pending.add(filePath);
        if (timer) clearTimeout(timer);
        timer = setTimeout(flush, 20);
    }

    watcher.on('change', schedule);
    watcher.on('add', schedule);
    watcher.on('unlink', schedule);

    logger.info(`Watching ${sourceDir} for changes...`);
}
