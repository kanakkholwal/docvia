import { resolve } from 'node:path';
import type {
    DockitConfig,
    DockitPlugin,
    FileEntry,
    FrontmatterData,
    HookPhase,
    IRDocument,
} from '@dockit/ir';
import { DockitError } from '@dockit/ir';
import { createJiti } from 'jiti';

// Plugin Resolution

export function resolvePlugins(plugins: readonly DockitPlugin[]): readonly DockitPlugin[] {
    const names = new Set<string>();

    for (const p of plugins) {
        if (!p.name) {
            throw new DockitError('PLUGIN_ERROR', 'Plugin missing name');
        }
        if (!p.version) {
            throw new DockitError('PLUGIN_ERROR', `Plugin "${p.name}" missing version`);
        }
        if (names.has(p.name)) {
            throw new DockitError('PLUGIN_ERROR', `Duplicate plugin: "${p.name}"`);
        }
        names.add(p.name);
    }

    return [...plugins].sort((a, b) => {
        const phaseOrder: Record<HookPhase, number> = { pre: 0, normal: 1, post: 2 };
        const pa = phaseOrder[a.phase ?? 'normal'];
        const pb = phaseOrder[b.phase ?? 'normal'];
        return pa !== pb ? pa - pb : (a.priority ?? 100) - (b.priority ?? 100);
    });
}

// Plugin Runner

export class PluginRunner {
    private readonly plugins: readonly DockitPlugin[];

    constructor(plugins: readonly DockitPlugin[]) {
        this.plugins = resolvePlugins(plugins);
    }

    async runBeforeParse(file: FileEntry): Promise<FileEntry> {
        let result = file;
        for (const plugin of this.plugins) {
            if (plugin.beforeParse) {
                result = await plugin.beforeParse(result);
            }
        }
        return result;
    }

    async runAfterParse(ast: unknown, file: FileEntry): Promise<unknown> {
        let result = ast;
        for (const plugin of this.plugins) {
            if (plugin.afterParse) {
                result = await plugin.afterParse(result, file);
            }
        }
        return result;
    }

    async runBeforeTransform(ast: unknown, meta: FrontmatterData): Promise<unknown> {
        let result = ast;
        for (const plugin of this.plugins) {
            if (plugin.beforeTransform) {
                result = await plugin.beforeTransform(result, meta);
            }
        }
        return result;
    }

    async runAfterTransform(doc: IRDocument): Promise<IRDocument> {
        let result = doc;
        for (const plugin of this.plugins) {
            if (plugin.afterTransform) {
                result = await plugin.afterTransform(result);
            }
        }
        return result;
    }

    async runBeforeRender(doc: IRDocument): Promise<IRDocument> {
        let result = doc;
        for (const plugin of this.plugins) {
            if (plugin.beforeRender) {
                result = await plugin.beforeRender(result);
            }
        }
        return result;
    }

    getPluginCacheKeys(): string[] {
        return this.plugins.map((p) => p.cacheKey?.() ?? `${p.name}@${p.version}`);
    }
}

// Config Loader

export function defineConfig(config: Partial<DockitConfig>): DockitConfig {
    return {
        sourceDir: config.sourceDir ?? 'docs',
        outDir: config.outDir ?? '.dockit',
        plugins: config.plugins ?? [],
        renderer: config.renderer,
        markdown: {
            remarkPlugins: config.markdown?.remarkPlugins ?? [],
        },
        syntax: {
            highlighter: config.syntax?.highlighter ?? 'shiki',
            theme: config.syntax?.theme ?? 'github-dark',
            langs: config.syntax?.langs ?? ['javascript', 'typescript', 'bash', 'json', 'css', 'html', 'svelte'],
        },
        theme: {
            name: config.theme?.name ?? 'default',
            options: config.theme?.options ?? {},
        },
    };
}

export async function loadConfig(configPath: string): Promise<DockitConfig> {
    try {
        const jiti = createJiti(import.meta.url, {
            moduleCache: false,
            fsCache: false,
        });

        // Use jiti to load the config; it handles TS and ESM-CJS conversion
        const mod = await jiti.import(resolve(configPath));
        const rawConfig = (mod as any).default ?? mod;

        return defineConfig(rawConfig);
    } catch (err) {
        throw new DockitError(
            'CONFIG_ERROR',
            `Failed to load config: ${configPath}`,
            configPath,
            undefined,
            err as Error,
        );
    }
}
