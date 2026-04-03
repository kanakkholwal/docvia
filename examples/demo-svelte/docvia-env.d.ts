declare module "docvia:source" {
	const source: typeof import("./.docvia/source");
	export const docviaSource: typeof source.docviaSource;
	export const docs: typeof source.docs;
}

declare module "docvia:source/registry" {
	const registry: import("./.docvia/registry").registry;
	export { registry };
}
