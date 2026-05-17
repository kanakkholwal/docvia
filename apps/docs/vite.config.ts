import { docvia } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
	// `docvia()` runs the CompileService in-process — no separate `docvia build`
	// step, a virtual `docvia/source` module in dev, and incremental HMR.
	plugins: [tailwindcss(), sveltekit(), docvia(docviaConfig)],

});
