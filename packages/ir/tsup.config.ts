import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/transform.ts'],
  sourcemap: true,
  splitting: false,
  clean: true,
  dts: true,
});