import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/transform.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
});