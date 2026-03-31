import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/node.ts'],
  format: ['esm'],
  external: [/\.svelte$/],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  shims: true,
  minify: false,
  outDir: 'dist',
  treeshake: true,
});
