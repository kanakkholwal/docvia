import type { ComponentRegistry, HydrationManifest } from "./types";
export declare function hydrate(manifest: HydrationManifest, registry: ComponentRegistry): Promise<void>;
