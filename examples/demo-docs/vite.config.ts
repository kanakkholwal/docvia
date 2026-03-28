import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { dockitMarkdownPlugin, dockitSourcePlugin } from '../../packages/plugins/vite/src/index.ts';
import dockitConfig from './dockit.config';

export default defineConfig({
    plugins: [
        sveltekit(),
        dockitSourcePlugin(),
        dockitMarkdownPlugin(dockitConfig)
    ],
    resolve: {
        alias: {
            '@dockit/renderer-core': '../../packages/renderer-core/src/index.ts',
            '@dockit/renderer-svelte': '../../packages/renderer-svelte/src/index.ts',
            '@dockit/ir': '../../packages/ir/src/index.ts',
            '@dockit/source': '../../packages/source/src/index.ts',
            '@dockit/vite-plugin': '../../packages/plugins/vite/src/index.ts'
        }
    },
    server: {
        fs: {
            allow: ['../../packages']
        }
    }
});
