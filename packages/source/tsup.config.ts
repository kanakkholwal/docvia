import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/internal.ts',
    'src/runtime.ts',
    'src/node.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  shims: true,
  minify: false,
});
