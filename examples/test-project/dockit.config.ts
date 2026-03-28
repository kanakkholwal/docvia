import { defineConfig } from '../packages/cli/src/index';
import { createSvelteRenderer } from '../packages/renderer-svelte/src/index';

export default defineConfig({
    dir: './docs',
    outDir: './.dockit',
    renderer: createSvelteRenderer({
        registry: {
            resolve: (name: string) => {
                if (name === 'content-counter') {
                    return {
                        component: 'CounterStub',
                        defaultProps: { count: 0 }
                    };
                }
                return null;
            },
            has: (name: string) => name === 'content-counter',
            get: (name: string) => name === 'content-counter' ? 'CounterStub' : null
        }
    }),
    plugins: [],
});
