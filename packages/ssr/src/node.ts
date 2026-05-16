// @docvia/ssr/node — Node-only content provider.
//
// Kept out of the edge-safe `@docvia/ssr` entry because it depends on the
// CompileService, which reads from the filesystem.

import type { CompileService } from "@docvia/runtime";
import type { ContentProvider } from "./types";

/**
 * Content provider backed by a live `CompileService` — compiles markdown from
 * disk on demand. Node only.
 *
 * The service must have run `compileAll()` first: that populates the route map
 * (and therefore the slug allowlist) the provider resolves against, so an
 * unknown slug returns `undefined` rather than touching an arbitrary path.
 */
export function FsContentProvider(service: CompileService): ContentProvider {
	return {
		getDocument(collection, slug) {
			return service.getDocument(collection, slug);
		},
	};
}
