import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
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

