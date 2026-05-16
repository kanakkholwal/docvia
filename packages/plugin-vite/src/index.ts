// `docvia()` is the all-in-one plugin: in-process compilation, virtual
// `docvia/source` module, file watching, and the `.md?docvia` transform.
//
// `docviaMarkdownPlugin` / `docviaSourcePlugin` remain exported for the legacy
// setup where a separate `docvia build` step produces the on-disk module graph.

export * from "./markdown";
export type { DocviaVitePluginOptions } from "./plugin";
export { docvia } from "./plugin";
export * from "./source";
