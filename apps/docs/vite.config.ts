import { docviaMarkdownPlugin, docviaSourcePlugin } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		docviaSourcePlugin(),
		docviaMarkdownPlugin(docviaConfig),
	],
	build: {
		rollupOptions: {
			external: ["@docvia/source", "@docvia/source/internal"],
		},
	},
});
