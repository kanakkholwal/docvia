import { defineConfig } from '@dockit/cli';
import { createShikiHighlighter, createSvelteRenderer } from '@dockit/renderer-svelte';

export default defineConfig({
    sourceDir: 'src/docs',
    outDir: '.dockit',

    // Configure your renderer with the Shiki highlighter
    renderer: createSvelteRenderer({
        highlighter: createShikiHighlighter({
            // Set your preferred Shiki theme (default is 'github-dark')
            theme: 'dracula',

            // Register languages you want to highlight
            langs: [
                'javascript',
                'typescript',
                'svelte',
                'html',
                'css',
                'bash',
                'json'
            ]
        }),
        registry: {

            resolve: (name: string) => {
                if (name === 'counter') {
                    return {
                        component: "./src/lib/components/Counter.svelte",
                        hydrate: true,
                        defaultProps: {
                            initial: 0
                        }
                    }
                }
                return null;

            }
        }
    })
});