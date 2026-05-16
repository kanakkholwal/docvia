import { docvia } from "@docvia/plugin-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import docviaConfig from "./docvia.config";

export default defineConfig({
	// `docvia()` runs the CompileService in-process — no separate `docvia build`
	// step, virtual `docvia/source` module in dev, incremental HMR.
	plugins: [sveltekit(), docvia(docviaConfig)],
});
