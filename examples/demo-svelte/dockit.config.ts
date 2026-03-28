
import { defineConfig } from '@dockit/cli';
import { createSvelteRenderer } from '@dockit/renderer-svelte';

export default defineConfig({
    sourceDir: 'src/docs',
    outDir: '.dockit',
    renderer: createSvelteRenderer()
});
