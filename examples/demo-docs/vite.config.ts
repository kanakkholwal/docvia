
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    resolve: {
        alias: {
            '@dockit/renderer-core': '../../packages/renderer-core/src/index.ts',
            '@dockit/renderer-svelte': '../../packages/renderer-svelte/src/index.ts',
            '@dockit/ir': '../../packages/ir/src/index.ts'
        }
    },
    server: {
        fs: {
            allow: ['../../packages']
        }
    }
});
