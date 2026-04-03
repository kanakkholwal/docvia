import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // client entry imports react-dom/client — must stay in a separate chunk
    // so SSR / RSC paths never accidentally pull in browser-only APIs.
    client: 'src/client.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  outDir: 'dist',
  treeshake: true,
  target: false,
  // React and react-dom are peer deps — never bundle them.
  deps: {
    onlyBundle: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']
  },
});
