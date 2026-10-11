// Browser only: imports react-dom/client. Never import from a Server Component or SSR path.
export {
	installCodeGroups,
	installCopyButtons,
} from "../render/client";
export type { HydrateOptions } from "./hydrate";
export { hydrate } from "./hydrate";
