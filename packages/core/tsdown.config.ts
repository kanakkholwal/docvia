import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    sourcemap: true,
    splitting: false,
    clean: true,
    dts: true,
    treeshake: true,
    outDir: 'dist',
  target: false,
})

