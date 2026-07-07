// Client entry: only the Svelte component. The build-time adapter (which pulls
// in @docvia/ir → node:path) lives behind the "@docvia/renderer-svelte/node"
// subpath so it never leaks into the browser bundle.
import Renderer from "./Renderer.svelte";

export { Renderer };
