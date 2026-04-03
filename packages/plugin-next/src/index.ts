import type { docviaConfig } from '@docvia/ir';
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
    const isDev = process.env.NODE_ENV !== 'production';

    // Singleton guard — Next.js evaluates config multiple times
    // (dev server restarts, webpack workers, etc.)
    if (process.env._DOCVIA_NEXT !== '1') {
        process.env._DOCVIA_NEXT = '1';
        _initPromise = init(isDev, options);
    }

    return function withDocviaConfig(nextConfig: NextConfig | ((phase: string, context: any) => NextConfig | Promise<NextConfig>) = {}): any {
        return async (phase: string, context: any) => {
            // Await initialization BEFORE Next.js continues.
            // This natively supports Turbopack because Turbopack will not start
            // resolving aliases until the config is fully resolved.
            if (_initPromise) {
                await _initPromise;
            }

            // Resolve the underlying config if it's a function or an async function
            const resolvedConfig = typeof nextConfig === 'function' ? await nextConfig(phase, context) : nextConfig;

            // Resolve the outDir so we can set up aliases/plugins pointing to files on disk.
            // We resolve against cwd() because that's where Next.js runs from.
            const outDir = resolve('.docvia');

            // Extract Turbopack configuration to support Next >= 15 / 16
            const isNext16Plus = resolvedConfig && typeof resolvedConfig === 'object' && "turbopack" in resolvedConfig;
            // Next.js 13/14+ will have a valid config object, we inject Webpack as a fallback or explicit
            const isNext13Plus = !isNext16Plus && ("webpack" in resolvedConfig);

            const configToReturn = {
                ...resolvedConfig,
                ...(isNext13Plus ? {
                    webpack(config: any, webpackOptions: any) {
                        // Resolve `docvia:source` → .docvia/source.ts
                        // Resolve `docvia:source/registry` → .docvia/registry.ts
                        //
                        // We use NormalModuleReplacementPlugin for Webpack.
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

                        return resolvedConfig.webpack?.(config, webpackOptions) ?? config;
                    },
                } : {}),
                ...(isNext16Plus ? {
                    turbopack: {
                        ...resolvedConfig.turbopack,
                        resolveAlias: {
                            ...resolvedConfig.turbopack?.resolveAlias,
                            "docvia:source": resolve(outDir, 'source.ts'),
                            "docvia:source/registry": resolve(outDir, 'registry.ts'),
                        }
                    },
                } : {}),
            };

            return configToReturn;
        };
    };
}

// Initialization: compile + (dev) watch

async function init(dev: boolean, options: DocviaNextOptions): Promise<void> {
    // Dynamic imports — these are Node-only, heavy deps that we should NOT
    // pull in at config-evaluation time. Keeps the top-level import clean
    // and avoids MODULE_NOT_FOUND if workspace packages aren't built yet
    // when Next.js first loads the config.
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
    const { docviaError } = await import('@docvia/ir');
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
