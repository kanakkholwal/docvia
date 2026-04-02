import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/node.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  shims: true,
  minify: false,
  outDir: 'dist',
  treeshake: true,
  deps: {
    neverBundle: [/\.svelte$/],
  },
  target: false,
});
