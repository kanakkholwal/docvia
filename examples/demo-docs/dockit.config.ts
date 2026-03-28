
import { defineConfig } from '@dockit/cli';
import { createSvelteRenderer } from '@dockit/renderer-svelte';

export default defineConfig({
    sourceDir: 'src/docs',
    outDir: '.dockit',
    renderer: createSvelteRenderer({
        registry: {
            resolve: (name) => {
                if (name === 'counter') {
                    return {
                        component: './src/lib/components/Counter.svelte',
                        defaultProps: { initial: 0 }
                    };
                }
                return null;
            },
        }
    })
});
