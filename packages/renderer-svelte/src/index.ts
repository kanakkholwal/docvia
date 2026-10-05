// Client entry: the component only. The build-time adapter lives at `/node`.
import Renderer from "./Renderer.svelte";

export type {
	ComponentRegistry,
	HydrationManifest,
	RenderOutput,
} from "@docvia/renderer-core";
export { Renderer };
