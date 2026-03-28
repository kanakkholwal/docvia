import { dockitMarkdownPlugin, dockitSourcePlugin } from '@dockit/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dockitConfig from './dockit.config';

export default defineConfig({
    plugins: [
        sveltekit(),
        dockitSourcePlugin(),
        dockitMarkdownPlugin(dockitConfig)
    ],
    server: {
        fs: {
            allow: ['.dockit']
        }
    },
    ssr: {
        external: ['@dockit/source', '@dockit/ir', '@dockit/core', '@dockit/schema', '@dockit/plugins']
    },
    build: {
        rollupOptions: {
            external: ['@dockit/source', '@dockit/ir', '@dockit/core', '@dockit/schema', '@dockit/plugins'],
            output: {
                format: 'es'
            }
        }
    }
});
