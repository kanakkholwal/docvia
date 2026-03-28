import { dockitMarkdownPlugin, dockitSourcePlugin } from "@dockit/vite-plugin";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dockitConfig from './dockit.config';


export default defineConfig({
    plugins: [
        sveltekit(),
        dockitSourcePlugin(),
        dockitMarkdownPlugin(dockitConfig)
    ],
	build: {
		rollupOptions: {
			external: ["@dockit/source", "@dockit/source/internal"]
		}
	}
});