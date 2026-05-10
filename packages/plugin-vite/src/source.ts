// biome-ignore-all lint/suspicious/noExplicitAny: Vite plugin config object is intentionally untyped passthrough.
import fs from "node:fs";
import path from "node:path";

const SOURCE_IDS = ["docvia:source", "docvia/source", "docvia-source"];
const REGISTRY_IDS = ["docvia:registry", "docvia/registry", "docvia-registry"];

export function docviaSourcePlugin() {
	return {
		name: "docvia:source",
		config(config: any) {
			const root = config.root || process.cwd();
			config.server = config.server || {};
			config.server.fs = config.server.fs || {};
			config.server.fs.allow = config.server.fs.allow || [];
			config.server.fs.allow.push(path.resolve(root, ".docvia"));

			return config;
		},

		resolveId(id: string) {
			const root = process.cwd();

			if (SOURCE_IDS.includes(id)) {
				const sourcePath = path.resolve(root, ".docvia/source.ts");
				if (fs.existsSync(sourcePath)) return sourcePath;
				return "\0docvia:source";
			}

			if (REGISTRY_IDS.includes(id)) {
				const registryPath = path.resolve(root, ".docvia/registry.ts");
				if (fs.existsSync(registryPath)) return registryPath;
				return "\0docvia:registry";
			}

			return null;
		},

		load(id: string) {
			if (id === "\0docvia:source") {
				return `
          import { createSource } from '@docvia/source/internal';
          export const docviaSource = createSource({});
        `;
			}

			if (id === "\0docvia:registry") {
				return `export const registry = { resolve() { return null; } };`;
			}

			return undefined;
		},
	};
}
