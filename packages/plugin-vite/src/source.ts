import fs from "node:fs";
import path from "node:path";

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
			if (id === "docvia:source") {
				return `\0${id}`;
			}
			return null;
		},

		load(id: string) {
			if (id !== "\0docvia:source") return;

			const root = process.cwd();
			const sourcePath = path.join(root, ".docvia/source.ts");

			if (!fs.existsSync(sourcePath)) {
				return `
          import { createSource } from '@docvia/source/internal';
          export const docviaSource = createSource({});
        `;
			}

			return fs.readFileSync(sourcePath, "utf-8");
		},
	};
}
