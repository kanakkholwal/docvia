#!/usr/bin/env node
// Release gate: install the tarballs into a fresh SvelteKit app outside the workspace
// (strict pnpm), then type-check and build it for Workers. `--keep` leaves the app.
import { execSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const keep = process.argv.includes("--keep");
const work = mkdtempSync(join(tmpdir(), "docvia-smoke-"));
const tarballs = join(work, "tarballs");
const app = join(work, "app");
const posix = (p) => p.replace(/\\/g, "/");

function run(cmd, cwd) {
	console.log(`\n$ ${cmd}  (${cwd})`);
	execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });
}

function write(file, content) {
	mkdirSync(dirname(join(app, file)), { recursive: true });
	writeFileSync(join(app, file), content);
}

try {
	mkdirSync(tarballs, { recursive: true });
	run(
		`pnpm -r --filter "./packages/*" pack --pack-destination "${posix(tarballs)}"`,
		repo,
	);

	// Point every @docvia/* dependency, direct or transitive, at the local tarball.
	const overrides = {};
	for (const file of readdirSync(tarballs)) {
		const name = file
			.replace(/^docvia-/, "@docvia/")
			.replace(/-\d+\.\d+\.\d+.*\.tgz$/, "");
		overrides[name] = `file:${posix(join(tarballs, file))}`;
	}
	const catalog = readFileSync(join(repo, "pnpm-workspace.yaml"), "utf8");
	const version = (name) =>
		catalog.match(
			new RegExp(`^\\s+'?${name.replace("/", "\\/")}'?: (\\S+)`, "m"),
		)?.[1] ?? "latest";

	write(
		"package.json",
		JSON.stringify(
			{
				name: "docvia-smoke",
				private: true,
				type: "module",
				imports: { "#lib/*": "./src/lib/*" },
				scripts: {
					check:
						"svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
					build: "vite build",
				},
				dependencies: {
					"@docvia/renderer-svelte": overrides["@docvia/renderer-svelte"],
					"@docvia/source": overrides["@docvia/source"],
				},
				devDependencies: {
					"@docvia/cli": overrides["@docvia/cli"],
					"@docvia/plugin-shiki": overrides["@docvia/plugin-shiki"],
					"@docvia/plugin-vite": overrides["@docvia/plugin-vite"],
					"@sveltejs/adapter-cloudflare": "latest",
					"@sveltejs/kit": version("@sveltejs/kit"),
					"@sveltejs/vite-plugin-svelte": version(
						"@sveltejs/vite-plugin-svelte",
					),
					svelte: version("svelte"),
					"svelte-check": "latest",
					typescript: version("typescript"),
					vite: version("vite"),
				},
			},
			null,
			2,
		),
	);
	write(
		".npmrc",
		"hoist=false\npublic-hoist-pattern=\nauto-install-peers=false\n",
	);
	write(
		"pnpm-workspace.yaml",
		[
			// pnpm 10 reads onlyBuiltDependencies; pnpm 11 reads allowBuilds.
			"onlyBuiltDependencies: [esbuild, workerd]",
			"allowBuilds:",
			"  esbuild: true",
			"  workerd: true",
			"overrides:",
			...Object.entries(overrides).map(([k, v]) => `  '${k}': '${v}'`),
			"",
		].join("\n"),
	);
	write(
		"vite.config.ts",
		`import { docvia } from "@docvia/plugin-vite";
import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [sveltekit({ adapter: adapter() }), docvia()] });
`,
	);
	write(
		"docvia.config.ts",
		`import { defineConfig } from "@docvia/plugin-vite";
import { shiki } from "@docvia/plugin-shiki";
import { createSvelteRenderer } from "@docvia/renderer-svelte/node";

export default defineConfig({
	components: ["./src/lib/docs/*.svelte"],
	renderer: createSvelteRenderer(),
	plugins: [shiki()],
});
`,
	);
	write(
		"tsconfig.json",
		JSON.stringify(
			{
				extends: "$app/tsconfig",
				compilerOptions: { strict: true },
				include: ["src", "*"],
			},
			null,
			2,
		),
	);
	// The macro API: types come from this file, no `.docvia/` or sync step.
	write(
		"src/lib/source.ts",
		`import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "docs" });
export const source = loader({ baseUrl: "/docs", source: docs.toDocviaSource() });
`,
	);
	write(
		"src/lib/registry.ts",
		`import { defineRegistry } from "@docvia/source/macro";

export const registry = defineRegistry();
`,
	);
	write(
		"docs/index.md",
		"---\ntitle: Home\n---\n\n# Home\n\n```npm\n@docvia/cli\n```\n\n::callout\n",
	);
	write("src/lib/docs/Callout.svelte", "<aside>callout</aside>\n");
	write(
		"src/app.html",
		'<!doctype html>\n<html lang="en">\n<head>%sveltekit.head%</head>\n<body><div>%sveltekit.body%</div></body>\n</html>\n',
	);
	write(
		"src/routes/docs/[...slug]/+page.server.ts",
		`import { error } from "@sveltejs/kit";
import { source } from "#lib/source.ts";

export const prerender = true;
export const entries = () => source.generateParams().map((p) => ({ slug: p.slug.join("/") }));

export async function load({ params }: { params: { slug: string } }) {
	const page = source.getPage(params.slug.split("/").filter(Boolean));
	if (!page) error(404);
	const drafts: boolean[] = source.getPages().map((p) => p.data.draft);
	const { content, toc } = await page.data.load();
	return { content, toc, title: page.data.title, drafts };
}
`,
	);
	write(
		"src/routes/docs/[...slug]/+page.svelte",
		`<script lang="ts">
import { Renderer } from "@docvia/renderer-svelte";
import { registry } from "#lib/registry.ts";

let { data } = $props();
</script>

<h1>{data.title}</h1>
<Renderer nodes={data.content} {registry} />
`,
	);

	run("pnpm install", app);
	run("pnpm check", app);
	run("pnpm build", app);

	const server = join(app, ".svelte-kit", "output", "server");
	const offenders = readdirSync(server, { recursive: true })
		.filter((f) => String(f).endsWith(".js"))
		.filter((f) =>
			/createRequire|from "yaml"/.test(
				readFileSync(join(server, String(f)), "utf8"),
			),
		);
	if (offenders.length > 0) {
		throw new Error(
			`Edge-unsafe code in the server bundle:\n${offenders.join("\n")}`,
		);
	}
	console.log("\npack-smoke: OK");
} finally {
	if (keep) console.log(`kept ${work}`);
	else rmSync(work, { recursive: true, force: true });
}
