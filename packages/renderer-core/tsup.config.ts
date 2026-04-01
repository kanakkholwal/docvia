import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: {
      resolve: true,
    },
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    splitting: false,
    outDir: 'dist',
})

