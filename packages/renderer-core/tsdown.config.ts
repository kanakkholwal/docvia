import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/**/*.ts'],
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
  target: false,
})

