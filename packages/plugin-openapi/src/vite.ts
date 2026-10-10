// biome-ignore-all lint/suspicious/noExplicitAny: structural Vite plugin, so Vite stays out of the dependencies.
import { resolve } from "node:path";
import { type BuildOptions, buildApiDocument } from "./build";
import type { ApiDocument } from "./model";
import { apiIndex } from "./source";
import { loadSpec } from "./spec";

export interface OpenAPIModuleOptions extends BuildOptions {
	/** Spec path (JSON or YAML), relative to the working directory. */
	readonly spec: string;
	/** Import id of the module. Default `"virtual:docvia/openapi"`. */
	readonly id?: string;
}

/**
 * Vite plugin whose module default-exports an `ApiSource` for `openapiSource()`: the index inline,
 * each operation a lazy chunk. The spec is parsed at build time, never in the browser or a Worker.
 */
export function openapiModule(options: OpenAPIModuleOptions) {
	const id = options.id ?? "virtual:docvia/openapi";
	const resolvedId = `\0${id}`;
	const operationPrefix = `${id}/operation/`;
	const specPath = resolve(options.spec);
	let cache: Promise<ApiDocument> | undefined;

	const document = () => {
		cache ??= loadSpec(specPath)
			.then(({ doc }) => buildApiDocument(doc, options))
			.catch((err) => {
				cache = undefined;
				throw err;
			});
		return cache;
	};

	return {
		name: "docvia:openapi",
		resolveId(source: string) {
			if (source === id || source.startsWith(operationPrefix))
				return `\0${source}`;
			return undefined;
		},
		async load(this: any, loadId: string) {
			if (loadId !== resolvedId && !loadId.startsWith(`\0${operationPrefix}`))
				return undefined;
			this.addWatchFile?.(specPath);
			const api = await document();
			if (loadId !== resolvedId) {
				const slug = loadId.slice(operationPrefix.length + 1);
				const op = api.operations.find((o) => o.slug === slug);
				if (!op)
					throw new Error(
						`[docvia] No OpenAPI operation "${slug}" in ${specPath}`,
					);
				return `export default ${JSON.stringify(op)};\n`;
			}
			const loaders = api.operations
				.map(
					(op) =>
						`\t${JSON.stringify(op.slug)}: () => import(${JSON.stringify(operationPrefix + op.slug)}),`,
				)
				.join("\n");
			return [
				`const operations = {\n${loaders}\n};`,
				`export default {`,
				`\tindex: ${JSON.stringify(apiIndex(api))},`,
				`\toperation: (slug) => operations[slug]().then((m) => m.default),`,
				`};`,
				"",
			].join("\n");
		},
		hotUpdate(this: any, { file }: { file: string }) {
			if (resolve(file) !== specPath) return;
			cache = undefined;
			const graph = this.environment.moduleGraph;
			for (const mod of graph.idToModuleMap.values())
				if (mod.id === resolvedId || mod.id?.startsWith(`\0${operationPrefix}`))
					graph.invalidateModule(mod);
			if (this.environment.name === "client")
				this.environment.hot.send({ type: "full-reload" });
			return [];
		},
	};
}
