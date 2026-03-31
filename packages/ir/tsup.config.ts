import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/transform.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
});