import { defineConfig } from '@docvia/cli';
import { createReactRenderer, createShikiHighlighter } from '@docvia/renderer-react';
import { z } from 'zod';

export default defineConfig({
    // Extend built-in frontmatter fields with app-specific ones.
    // The compiler merges this with the base schema (title, description, tags…),
    // validates every page at build time, and emits a typed Frontmatter interface
    // instead of the default union-of-literal-values.
    schema: z.object({
        author: z.string().optional(),
        order: z.number().optional(),
    }),

    sourceDir: 'docs',
    outDir: '.docvia',

    // Register components here — the compiler generates the runtime registry
    // so individual pages don't need to import them manually.
    components: {
        counter: {
            path: './components/Counter',
            hydrate: true,
            defaultProps: {
                initial: 0,
            },
        },
    },

    renderer: createReactRenderer({
        highlighter: createShikiHighlighter({
            theme: 'github-dark',
            langs: [
                'javascript',
                'typescript',
                'tsx',
                'jsx',
                'bash',
                'json',
                'css',
                'html',
            ],
        }),
    }),
});
