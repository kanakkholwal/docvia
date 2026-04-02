import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/transform.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  target: false,
  deps:{
    onlyBundle: ['github-slugger', "@types/hast","@types/unist"],
  }
})

