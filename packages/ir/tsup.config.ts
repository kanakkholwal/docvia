import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/transform.ts'],
  format: ['cjs', 'esm'], // Build for both Node and Browser/Bundlers
  dts: true,              // Generates .d.ts files in dist/
  sourcemap: true,        // Generates .js.map files in dist/
  clean: true,            // Wipes the dist/ folder before building
  treeshake: true,        // Removes unused code
  minify: true,           // Minifies the output for a smaller footprint
  splitting: false,       // Disables code splitting for simpler library output
  outDir: 'dist',
});