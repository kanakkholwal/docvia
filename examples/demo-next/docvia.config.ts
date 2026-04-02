import { defineConfig } from '@docvia/cli';
import { createReactRenderer, createShikiHighlighter } from '@docvia/renderer-react';

export default defineConfig({
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
