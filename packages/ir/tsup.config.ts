import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/transform.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  shims: true,
  minify: false,
});