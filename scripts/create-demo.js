import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEMO_DIR = "examples/demo-docs";

async function createDemo() {
	console.log("🚀 Creating docvia Demo Project...");

	// 1. Create directory structure
	await mkdir(DEMO_DIR, { recursive: true });
	await mkdir(join(DEMO_DIR, "docs"), { recursive: true });
	await mkdir(join(DEMO_DIR, "src/lib/components"), { recursive: true });
	await mkdir(join(DEMO_DIR, "src/routes/[...slug]"), { recursive: true });

	// 2. Scaffold package.json
	const packageJson = {
		name: "demo-docs",
		private: true,
		type: "module",
		scripts: {
			dev: "vite dev",
			build: "vite build",
			preview: "vite preview",
			"docvia:build": "docvia build",
		},
		devDependencies: {
			"@sveltejs/adapter-auto": "^3.0.0",
			"@sveltejs/kit": "^2.0.0",
			"@sveltejs/vite-plugin-svelte": "^3.0.0",
			svelte: "^4.2.0",
			vite: "^8.0.3",
			"@docvia/cli": "workspace:*",
			"@docvia/compiler": "workspace:*",
			"@docvia/renderer-svelte": "workspace:*",
		},
	};
	await writeFile(
		join(DEMO_DIR, "package.json"),
		JSON.stringify(packageJson, null, 2),
	);

	// 3. Create svelte.config.js
	const svelteConfig = `
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
`;
	await writeFile(join(DEMO_DIR, "svelte.config.js"), svelteConfig);

	// 4. Create vite.config.ts
	const viteConfig = `
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
    server: {
        fs: {
            allow: ['../../packages']
        }
    }
});
`;
	await writeFile(join(DEMO_DIR, "vite.config.ts"), viteConfig);

	// 5. Create docvia.config.ts
	const docviaConfig = `
import { defineConfig } from '@docvia/cli';
import { createSvelteRenderer } from '@docvia/renderer-svelte';

export default defineConfig({
    dir: './docs',
    outDir: './.docvia',
    renderer: createSvelteRenderer({
        registry: {
            resolve: (name) => {
                if (name === 'counter') {
                    return {
                        component: './src/lib/components/Counter.svelte',
                        defaultProps: { initial: 0 }
                    };
                }
                return null;
            }
        }
    })
});
`;
	await writeFile(join(DEMO_DIR, "docvia.config.ts"), docviaConfig);

	// 6. Create Counter.svelte
	const counterSvelte = `
<script>
    export let initial = 0;
    let count = initial;
</script>

<div class="counter">
    <button on:click={() => count--}>-</button>
    <span>{count}</span>
    <button on:click={() => count++}>+</button>
</div>

<style>
    .counter {
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 1rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.5rem;
    }
    button {
        background: #38bdf8;
        color: white;
        border: none;
        width: 2rem;
        height: 2rem;
        border-radius: 0.25rem;
        cursor: pointer;
    }
</style>
`;
	await writeFile(
		join(DEMO_DIR, "src/lib/components/Counter.svelte"),
		counterSvelte,
	);

	// 7. Create Layout component (now inside demo app)
	const layoutSvelte = `
<script lang="ts">
    import '../../app.css';
</script>

<div class="docvia-layout">
    <header class="docvia-header">
        <div class="docvia-logo">
            <a href="/">docvia Demo</a>
        </div>
    </header>

    <div class="docvia-container">
        <aside class="docvia-sidebar">
            <nav>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/components">Components</a></li>
                </ul>
            </nav>
        </aside>

        <main class="docvia-main">
            <slot />
        </main>
    </div>
</div>

<style>
    .docvia-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .docvia-header {
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 2rem;
        background-color: #0f172a;
        border-bottom: 1px solid #1e293b;
        position: sticky;
        top: 0;
        z-index: 50;
    }

    .docvia-logo a {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        text-decoration: none;
    }

    .docvia-container {
        display: flex;
        flex: 1;
    }

    .docvia-sidebar {
        width: 280px;
        border-right: 1px solid #1e293b;
        padding: 2rem;
        position: sticky;
        top: 64px;
        height: calc(100vh - 64px);
    }

    .docvia-sidebar ul {
        list-style: none;
        padding: 0;
    }

    .docvia-sidebar a {
        display: block;
        padding: 0.5rem 0;
        color: #94a3b8;
        text-decoration: none;
        transition: color 0.2s;
    }

    .docvia-sidebar a:hover {
        color: white;
    }

    .docvia-main {
        flex: 1;
        padding: 2rem 4rem;
        max-width: 800px;
        margin: 0 auto;
    }
</style>
`;
	await mkdir(join(DEMO_DIR, "src/lib"), { recursive: true });
	await writeFile(join(DEMO_DIR, "src/lib/Layout.svelte"), layoutSvelte);

	const appCss = `
:root {
    --docvia-bg: #0f172a;
    --docvia-fg: #f8fafc;
}

body {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background-color: var(--docvia-bg);
    color: var(--docvia-fg);
}
`;
	await writeFile(join(DEMO_DIR, "src/app.css"), appCss);

	// 8. Create +layout.svelte
	const rootLayoutSvelte = `
<script>
    import Layout from '$lib/Layout.svelte';
</script>

<Layout>
    <slot />
</Layout>
`;
	await writeFile(
		join(DEMO_DIR, "src/routes/+layout.svelte"),
		rootLayoutSvelte,
	);

	// 9. Create routing layer (+page.ts and +page.svelte)
	const pageTs = `
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const slug = params.slug || 'index';
    try {
        const mod = await import(\`../../../.docvia/pages/\${slug.replace(/\\//g, '.')}.js\`);
        return {
            doc: mod.content,
            meta: mod.meta,
            manifest: mod.manifest
        };
    } catch (e) {
        console.error(e);
        throw error(404, 'Page not found');
    }
};
`;
	await writeFile(join(DEMO_DIR, "src/routes/[...slug]/+page.ts"), pageTs);

	const pageSvelte = `
<script lang="ts">
    import { Renderer, hydrate } from '@docvia/renderer-svelte';
    import { onMount } from 'svelte';
    import Counter from '$lib/components/Counter.svelte';

    export let data;

    const registry = {
        resolve: (name) => {
            if (name === 'counter') return { component: Counter };
            return null;
        }
    };

    onMount(() => {
        hydrate(data.manifest, registry);
    });
</script>

<Renderer nodes={data.doc} {registry} />
`;
	await writeFile(
		join(DEMO_DIR, "src/routes/[...slug]/+page.svelte"),
		pageSvelte,
	);

	// 10. Create sample content
	const indexMd = `---
title: Welcome to docvia
description: Demo of partial hydration.
---

# Welcome 🚀

::counter{initial=10 hydrate="client:load"}

Scroll down for visibility hydration.

<div style="height: 100vh"></div>

::counter{initial=100 hydrate="client:visible"}
`;
	await writeFile(join(DEMO_DIR, "docs/index.md"), indexMd);

	const componentsMd = `---
title: Components
---

# Components

- Table support
- Nested lists
- Custom directives

| Prop | Type | Description |
|------|------|-------------|
| count| number| Initial value|
`;
	await writeFile(join(DEMO_DIR, "docs/components.md"), componentsMd);

	console.log("✅ Demo project scaffolded in examples/demo-docs");
}

createDemo().catch(console.error);
