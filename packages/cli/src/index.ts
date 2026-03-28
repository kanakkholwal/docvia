#!/usr/bin/env node
import { compile } from '@dockit/compiler';
import type { DockitConfig } from '@dockit/ir';
import { DockitError } from '@dockit/ir';
import { defineConfig, loadConfig } from '@dockit/plugins';
import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

// Error Formatting

function formatError(err: DockitError): string {
    const loc = err.loc ? `:${err.loc.line}:${err.loc.column}` : '';
    const file = err.file ? `\n  → ${err.file}${loc}` : '';
    return `\x1b[31m[${err.code}]\x1b[0m ${err.message}${file}`;
}

// CLI

const program = new Command();

program
    .name('dockit')
    .description('Dockit — Build-time documentation compiler')
    .version('0.0.1');

// init

program
    .command('init')
    .description('Scaffold a new Dockit project')
    .option('-d, --dir <dir>', 'Project directory', '.')
    .action(async (opts: { dir: string }) => {
        const projectDir = resolve(opts.dir);
        const dir = join(projectDir, 'docs');

        await mkdir(dir, { recursive: true });

        // Create sample docs
        await writeFile(
            join(dir, 'index.md'),
            `---
title: Welcome to Dockit
description: Your documentation starts here
tags: [getting-started]
---

# Welcome to Dockit

This is your documentation home page. Edit \`docs/index.md\` to get started.

## Features

- **Build-time compilation** — Zero runtime markdown parsing
- **Incremental rebuilds** — Only recompile what changed
- **Full-text search** — Powered by Orama
- **Plugin system** — Extend with custom hooks

## Quick Start

\`\`\`bash
dockit build
dockit dev
\`\`\`
`,
            'utf-8',
        );

        await writeFile(
            join(dir, 'getting-started.md'),
            `---
title: Getting Started
description: Learn how to set up Dockit
tags: [guide, tutorial]
order: 1
---

# Getting Started

## Installation

\`\`\`bash
pnpm add @dockit/cli -D
\`\`\`

## Project Structure

| Directory | Purpose |
|-----------|---------|
| \`docs/\` | Markdown source files |
| \`.dockit/\` | Compiled output |
| \`dockit.config.ts\` | Configuration |

## Writing Documentation

Create markdown files in the \`docs/\` directory:

\`\`\`markdown
---
title: My Page
description: A description of my page
tags: [example]
---

# My Page

Content goes here.
\`\`\`

## Building

Run the build command to compile your documentation:

\`\`\`bash
dockit build
\`\`\`

This will generate compiled output in the \`.dockit/\` directory.
`,
            'utf-8',
        );

        await writeFile(
            join(dir, 'components.md'),
            `---
title: Components
description: Using custom components via directives
tags: [advanced, components]
order: 2
---

# Components

Dockit supports custom components via the directive syntax.

## Usage

Use the \`::directive\` syntax to embed components:

:::note
This is a note component rendered via the directive system.
:::

:::warning
This is a warning — handle with care!
:::

## Code Examples

Here's a TypeScript example:

\`\`\`typescript
import { defineConfig } from '@dockit/cli';

export default defineConfig({
  dir: 'docs',
  plugins: [],
});
\`\`\`

And a Svelte component:

\`\`\`svelte
<script>
  export let title = 'Hello';
</script>

<div class="card">
  <h2>{title}</h2>
  <slot />
</div>
\`\`\`
`,
            'utf-8',
        );

        // Create config
        await writeFile(
            join(projectDir, 'dockit.config.ts'),
            `import { defineConfig } from '@dockit/cli';

export default defineConfig({
  sourceDir: 'docs',
  outDir: '.dockit',
  plugins: [],
});
`,
            'utf-8',
        );

        console.log('\x1b[32m✓\x1b[0m Project initialized');
        console.log('  Created docs/ with sample documentation');
        console.log('  Created dockit.config.ts');
        console.log('\n  Run \x1b[36mdockit build\x1b[0m to compile');
    });

export { defineConfig };

// build

program
    .command('build')
    .description('Compile documentation')
    .option('--docs <dir>', 'Docs directory')
    .option('--out <dir>', 'Output directory')
    .option('--config <path>', 'Config file path', "./dockit.config.ts")
    .action(async (opts: { docs?: string; out?: string; config?: string }) => {
        try {
            const configPath = opts.config ?? resolve('dockit.config.ts');
            let config: DockitConfig;

            if (existsSync(configPath)) {
                config = await loadConfig(configPath);
            } else {
                config = defineConfig({});
            }

            const dir = opts.docs ?? config.sourceDir;
            const outDir = opts.out ?? config.outDir;

            if (!existsSync(resolve(dir))) {
                console.error(`\x1b[31m[ERROR]\x1b[0m Docs directory not found: ${dir}`);
                console.error('  Run \x1b[36mdockit init\x1b[0m first');
                process.exit(1);
            }

            console.log('\x1b[36m◆\x1b[0m Building documentation...');
            const renderer = config.renderer
            if (!renderer) {
                throw new DockitError("CONFIG_ERROR", "No renderer configured");
            }
            const result = await compile({
                sourceDir: resolve(dir),
                outDir: resolve(outDir),
                renderer,
                plugins: [...config.plugins],
                config,
            });

            console.log(`\n\x1b[32m✓\x1b[0m Build complete in ${Math.round(result.duration)}ms`);
            console.log(`  ${result.stats.total} files compiled`);
            console.log(`  ${result.pages.length} pages generated`);
            console.log(`  Output: ${resolve(outDir)}`);
        } catch (err) {
            if (err instanceof DockitError) {
                console.error(formatError(err));
                if (err.cause) console.error(err.cause);
            } else {
                console.error('\x1b[31m[ERROR]\x1b[0m', (err as Error).message);
                console.error((err as Error).stack);
            }
            process.exit(1);
        }
    });

// preview

program
    .command('preview')
    .description('Serve compiled output')
    .option('--out <dir>', 'Output directory', '.dockit')
    .option('-p, --port <port>', 'Port', '4173')
    .action(async (opts: { out: string; port: string }) => {
        const outDir = resolve(opts.out);

        if (!existsSync(outDir)) {
            console.error(`\x1b[31m[ERROR]\x1b[0m Output directory not found: ${outDir}`);
            console.error('  Run \x1b[36mdockit build\x1b[0m first');
            process.exit(1);
        }

        try {
            const { createServer } = await import('node:http');
            const sirv = (await import('sirv')).default;
            const handler = sirv(outDir, { dev: true, single: false });
            const server = createServer(handler);
            const port = Number.parseInt(opts.port, 10);

            server.listen(port, () => {
                console.log(`\x1b[32m✓\x1b[0m Preview server running at \x1b[36mhttp://localhost:${port}\x1b[0m`);
            });
        } catch (err) {
            console.error('\x1b[31m[ERROR]\x1b[0m Failed to start preview server:', (err as Error).message);
            process.exit(1);
        }
    });

// dev

program
    .command('dev')
    .description('Start dev mode with file watching')
    .option('--docs <dir>', 'Docs directory')
    .option('--out <dir>', 'Output directory')
    .option('--config <path>', 'Config file path', "./dockit.config.ts")
    .action(async (opts: { docs?: string; out?: string; config?: string }) => {
        try {
            const configPath = opts.config ?? resolve('dockit.config.ts');
            let config: DockitConfig;

            if (existsSync(configPath)) {
                config = await loadConfig(configPath);
            } else {
                config = defineConfig({});
            }

            const sourceDir = resolve(opts.docs ?? config.sourceDir ?? 'docs');
            const outDir = resolve(opts.out ?? config.outDir ?? '.dockit');

            if (!existsSync(sourceDir)) {
                console.error(`\x1b[31m[ERROR]\x1b[0m Source directory not found: ${sourceDir}`);
                process.exit(1);
            }

            console.log('\x1b[36m◆\x1b[0m Starting dev mode...');

            // Initial build
            const renderer = config.renderer;
            if (!renderer) {
                throw new DockitError("CONFIG_ERROR", "No renderer configured");
            }
            const result = await compile({
                sourceDir,
                outDir,
                renderer,
                plugins: [...config.plugins],
                config,
            });

            console.log(`\x1b[32m✓\x1b[0m Initial build: ${Math.round(result.duration)}ms (${result.stats.total} files)`);

            // Watch for changes
            const { watch } = await import('chokidar');
            let pending = new Set<string>();
            let timer: ReturnType<typeof setTimeout> | null = null;

            const watcher = watch(sourceDir, {
                ignoreInitial: true,
                awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
            });

            function flush() {
                if (pending.size === 0) return;
                const files = [...pending];
                pending = new Set();
                timer = null;

                console.log(`\x1b[36m◆\x1b[0m Rebuilding ${files.length} file(s)...`);
                const start = performance.now();
                const renderer = config.renderer;
                if (!renderer) {
                    throw new DockitError("CONFIG_ERROR", "No renderer configured");
                }
                compile({
                    sourceDir,
                    outDir,
                    renderer,
                    plugins: [...config.plugins],
                    config,
                }).then(() => {
                    const ms = Math.round(performance.now() - start);
                    console.log(`\x1b[32m✓\x1b[0m Rebuild: ${ms}ms`);
                }).catch((err: unknown) => {
                    if (err instanceof DockitError) {
                        console.error(formatError(err));
                    } else {
                        console.error('\x1b[31m[ERROR]\x1b[0m', (err as Error).message);
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

            console.log(`\x1b[36m◆\x1b[0m Watching ${sourceDir} for changes...`);
            console.log('  Press Ctrl+C to stop\n');
        } catch (err) {
            if (err instanceof DockitError) {
                console.error(formatError(err));
            } else {
                console.error('\x1b[31m[ERROR]\x1b[0m', (err as Error).message);
            }
            process.exit(1);
        }
    });

program.parse();
