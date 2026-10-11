// Server-safe: no react-dom/client here, so Server Components can import it.
export type {
	ComponentRegistry,
	HydrationManifest,
	ModuleRendererOptions as ReactRendererOptions,
	RenderOutput,
	RenderTransform,
} from "../render/index";
export { createReactRenderer } from "./adapter";
export type {
	CodeBlockOverrideProps,
	RendererComponents,
	RendererProps,
} from "./Renderer";
export { Renderer } from "./Renderer";
