import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    entry: 'src/adapter.ts',
  },
  sourcemap: true,
  splitting: false,
  clean: true,
  shims: true,
  minify: false,
});
