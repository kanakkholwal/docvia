import type { docviaConfig } from '@docvia/ir';
import { docviaError } from '@docvia/ir';
import type { NextConfig } from 'next';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DocviaNextOptions {
    /** Path to docvia.config.ts relative to project root (default: './docvia.config.ts') */
    configPath?: string;
}

// Stores the init promise so the Webpack plugin can await it before compilation starts
let _initPromise: Promise<void> | null = null;

/**
 * Create a Next.js config wrapper that integrates docvia's compilation,
 * file-watching, and module resolution directly into the Next.js lifecycle.
 *
 * @example
 * ```ts
 * // next.config.ts
 * import { withDocvia } from '@docvia/plugin-next';
 *
 * const withDocs = withDocvia();
 * export default withDocs({});
 * ```
 */
export function withDocvia(options: DocviaNextOptions = {}) {
    const isDev = process.env.NODE_ENV === 'development';

    // Singleton guard — Next.js evaluates config multiple times
    // (dev server restarts, webpack workers, etc.)
    if (process.env._DOCVIA_NEXT !== '1') {
        process.env._DOCVIA_NEXT = '1';
        _initPromise = init(isDev, options);
    }

    return (nextConfig: NextConfig = {}): NextConfig => {
        // Resolve the outDir so we can set up aliases/plugins pointing to files on disk.
        // We resolve against cwd() because that's where Next.js runs from.
        const outDir = resolve(options.configPath ? '.' : '.', '.docvia');

        return {
            ...nextConfig,
            webpack(config, webpackOptions) {
                // --- Edge Case 1: Race condition ---
                // init() is async and may not have finished writing .docvia/ files
                // by the time webpack starts resolving modules. We inject a tiny
                // plugin that blocks the first webpack compilation until init() is done.
                if (_initPromise) {
                    const waitPromise = _initPromise;
                    config.plugins.push({
                        apply(compiler: any) {
                            compiler.hooks.beforeCompile.tapPromise(
                                'DocviaWaitPlugin',
                                async () => {
                                    await waitPromise;
                                },
                            );
                        },
                    });
                }

                // Resolve `docvia:source` → .docvia/source.ts
                // Resolve `docvia:source/registry` → .docvia/registry.ts
                //
                // We use NormalModuleReplacementPlugin because webpack 5 treats
                // the `docvia:` prefix as a URI scheme and processes it before
                // resolve.alias gets a chance to match.
                config.plugins.push(
                    new webpackOptions.webpack.NormalModuleReplacementPlugin(
                        /^docvia:source(\/.*)?$/,
                        (resource: { request: string }) => {
                            if (resource.request === 'docvia:source') {
                                resource.request = resolve(outDir, 'source.ts');
                            } else if (resource.request === 'docvia:source/registry') {
                                resource.request = resolve(outDir, 'registry.ts');
                            }
                        },
                    ),
                );

                return nextConfig.webpack?.(config, webpackOptions) ?? config;
            },
        };
    };
}

// ---------------------------------------------------------------------------
// Initialization: compile + (dev) watch
// ---------------------------------------------------------------------------

async function init(dev: boolean, options: DocviaNextOptions): Promise<void> {
    // Dynamic imports — these are Node-only, heavy deps that we don't want
    // in the webpack bundle or parsed at config-evaluation time.
    const { compile } = await import('@docvia/compiler');
    const { loadConfig, defineConfig } = await import('@docvia/plugins');

    const configPath = resolve(options.configPath ?? './docvia.config.ts');

    let config: docviaConfig;
    if (existsSync(configPath)) {
        config = await loadConfig(configPath);
    } else {
        config = defineConfig({});
    }

    const sourceDir = resolve(config.sourceDir);
    const outDir = resolve(config.outDir);
    const renderer = config.renderer;

    if (!renderer) {
        console.warn(
            '[docvia] No renderer configured in docvia.config.ts — skipping compilation.\n' +
            '         Add a renderer (e.g. createReactRenderer()) to enable documentation compilation.',
        );
        return;
    }

    if (!existsSync(sourceDir)) {
        console.warn(
            `[docvia] Source directory not found: ${sourceDir}\n` +
            '         Run `docvia init` or create the directory to get started.',
        );
        return;
    }

    // --- Initial build ---
    try {
        console.log('[docvia] Compiling documentation...');
        const result = await compile({
            sourceDir,
            outDir,
            renderer,
            plugins: [...config.plugins],
            config,
        });
        console.log(
            `[docvia] \u2713 Built ${result.stats.total} files in ${Math.round(result.duration)}ms`,
        );
    } catch (err) {
        if (err instanceof docviaError) {
            console.error(`[docvia] Build failed: [${err.code}] ${err.message}`);
            if (err.file) console.error(`         → ${err.file}`);
        } else {
            console.error('[docvia] Build failed:', (err as Error).message);
        }
        // Don't throw — let Next.js start anyway so the user can see the error
        // in the browser overlay and fix it without restarting the dev server.
        return;
    }

    // --- Dev mode: watch for markdown file changes ---
    if (dev) {
        await startDevWatcher(sourceDir, outDir, renderer, config);
    }
}

async function startDevWatcher(
    sourceDir: string,
    outDir: string,
    renderer: NonNullable<docviaConfig['renderer']>,
    config: docviaConfig,
): Promise<void> {
    const { compile } = await import('@docvia/compiler');
    const { watch } = await import('chokidar');

    let pending = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isRebuilding = false;

    const watcher = watch(sourceDir, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
    });

    function flush() {
        if (pending.size === 0 || isRebuilding) return;
        const count = pending.size;
        pending = new Set();
        timer = null;
        isRebuilding = true;

        console.log(`[docvia] Rebuilding (${count} file(s) changed)...`);
        compile({
            sourceDir,
            outDir,
            renderer,
            plugins: [...config.plugins],
            config,
        })
            .then((r) => {
                console.log(`[docvia] \u2713 Rebuilt in ${Math.round(r.duration)}ms`);
            })
            .catch((err: unknown) => {
                if (err instanceof docviaError) {
                    console.error(`[docvia] Rebuild failed: [${err.code}] ${err.message}`);
                } else {
                    console.error('[docvia] Rebuild error:', (err as Error).message);
                }
            })
            .finally(() => {
                isRebuilding = false;
                // If more changes accumulated during the rebuild, flush again
                if (pending.size > 0) {
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

    console.log(`[docvia] Watching ${sourceDir} for changes...`);

    process.on('exit', () => {
        if (!watcher.closed) {
            console.log('[docvia] Closing file watcher');
            void watcher.close();
        }
    });
}
