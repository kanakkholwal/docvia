<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card } from "$lib/components/ui/card";
	import {
		ArrowRight,
		Boxes,
		FileText,
		Gauge,
		Layers,
		Search,
		ShieldCheck,
		Terminal,
	} from "@lucide/svelte";

	const installCmd = "pnpm add -D @docvia/cli";

	const features = [
		{
			icon: Gauge,
			title: "Build-time first",
			body: "No runtime markdown parser ships to the browser. Pages are pre-rendered into a tiny module graph at build time.",
		},
		{
			icon: Layers,
			title: "Incremental cache",
			body: "A content-addressable cache skips unchanged files. Subsequent builds for unchanged content take milliseconds.",
		},
		{
			icon: FileText,
			title: "Typed frontmatter",
			body: "Extend the built-in schema with a Zod object. docvia generates a typed Frontmatter interface for every collection.",
		},
		{
			icon: Boxes,
			title: "Framework adapters",
			body: "First-party React and Svelte renderers, with a Vite plugin and Next.js wrapper for direct integration.",
		},
		{
			icon: Search,
			title: "Section-level search",
			body: "Built-in Orama indexing groups by heading. Field-weighted ranking gives fast, accurate results client-side.",
		},
		{
			icon: ShieldCheck,
			title: "Sanitized by default",
			body: "Markdown passes through a strict allow-list. Script, iframe, object and embed tags are blocked.",
		},
	];

	const codeConfig = `import { defineConfig } from "@docvia/cli";
import {
  createReactRenderer,
  createShikiHighlighter,
} from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["typescript", "bash", "json"],
    }),
  }),
});`;

	const codeUsage = `import { docviaSource } from "docvia/source";

// Typed routes, typed frontmatter, fully tree-shakeable.
const page = await docviaSource.docs.get("getting-started");

console.log(page.meta.title);
console.log(page.content);`;
</script>

<svelte:head>
	<title>docvia — Build-time documentation compiler</title>
	<meta
		name="description"
		content="docvia is a build-time documentation compiler for React, Svelte, and any framework with a renderer adapter. Typed frontmatter, incremental builds, zero runtime markdown parsing."
	/>
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-subtle)_0%,transparent_70%)] opacity-70"
	></div>
	<div class="mx-auto max-w-[1200px] px-6 pt-20 pb-16 md:px-10 md:pt-32 md:pb-24">
		<div class="mx-auto flex max-w-3xl flex-col items-center text-center">
			<span
				class="inline-flex items-center gap-2 rounded-full border border-border bg-bg-subtle px-3 py-1 text-xs uppercase tracking-[0.05em] text-fg-muted"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
				v0.1 preview · public soon
			</span>
			<h1
				class="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
			>
				Documentation, <span class="text-accent">compiled.</span>
			</h1>
			<p class="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl">
				docvia turns a directory of Markdown into typed, pre-rendered modules
				for React, Svelte, or any framework with a renderer adapter — with
				incremental builds and zero runtime parsing.
			</p>
			<div class="mt-8 flex flex-col items-center gap-3 sm:flex-row">
				<Button size="lg" href="/docs">
					Read the docs
					<ArrowRight />
				</Button>
				<Button
					variant="ghost"
					size="lg"
					href="https://github.com/kanakkholwal/docvia"
				>
					View on GitHub
				</Button>
			</div>

			<!-- Terminal mock -->
			<div
				class="mt-12 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-bg-subtle text-left shadow-[var(--shadow-md)]"
			>
				<div
					class="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-fg-muted"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-fg-subtle/30"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-fg-subtle/30"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-fg-subtle/30"></span>
					<span class="ml-2 font-mono">~/my-app</span>
				</div>
				<pre
					class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"><code><span class="text-fg-subtle">$</span> {installCmd}
<span class="text-fg-subtle">$</span> npx docvia init <span class="text-fg-subtle">--renderer react</span>
<span class="text-success">✓</span> Project initialized
  Created <span class="text-accent">docs/</span> with sample documentation
  Created <span class="text-accent">docvia.config.ts</span>

<span class="text-fg-subtle">$</span> npx docvia build
<span class="text-success">✓</span> Build complete in 109ms
  6 files → 6 compiled
  6 pages generated</code></pre>
			</div>
		</div>
	</div>
</section>

<!-- Features -->
<section id="features" class="border-t border-border/60 bg-bg-subtle/30">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-16 max-w-2xl text-center">
			<span
				class="text-xs font-medium uppercase tracking-[0.05em] text-accent"
			>
				Why docvia
			</span>
			<h2
				class="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Engineered for compile-time speed.
			</h2>
			<p class="mt-4 text-lg text-fg-muted">
				The same primitives that make modern bundlers fast — hashing,
				caching, parallelism — applied to docs.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature}
				<Card class="flex flex-col gap-3">
					<div
						class="grid h-10 w-10 place-items-center rounded-md bg-accent-subtle text-accent"
					>
						<feature.icon class="h-5 w-5" />
					</div>
					<h3 class="font-display text-lg font-semibold tracking-tight">
						{feature.title}
					</h3>
					<p class="text-sm leading-relaxed text-fg-muted">
						{feature.body}
					</p>
				</Card>
			{/each}
		</div>
	</div>
</section>

<!-- Code-first feature: configure -->
<section class="border-t border-border/60">
	<div
		class="mx-auto grid max-w-[1200px] gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:px-10 md:py-32"
	>
		<div>
			<span
				class="text-xs font-medium uppercase tracking-[0.05em] text-accent"
			>
				One config file
			</span>
			<h2
				class="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Sensible defaults. Typed everywhere.
			</h2>
			<p class="mt-4 text-lg leading-relaxed text-fg-muted">
				<code class="font-mono text-base text-fg">defineConfig</code> fills
				in defaults so a minimal project is two imports and a renderer. Bring
				your own Zod schema for frontmatter and docvia generates the
				TypeScript interface for you.
			</p>
		</div>
		<div
			class="overflow-hidden rounded-xl border border-border bg-bg-subtle shadow-[var(--shadow-sm)]"
		>
			<div
				class="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-fg-muted"
			>
				<span class="font-mono">docvia.config.ts</span>
				<Terminal class="h-3.5 w-3.5" />
			</div>
			<pre
				class="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-fg"><code>{codeConfig}</code></pre>
		</div>
	</div>
</section>

<!-- Code-first feature: consume -->
<section class="border-t border-border/60 bg-bg-subtle/30">
	<div
		class="mx-auto grid max-w-[1200px] gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:px-10 md:py-32"
	>
		<div class="md:order-2">
			<span
				class="text-xs font-medium uppercase tracking-[0.05em] text-accent"
			>
				Typed module graph
			</span>
			<h2
				class="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Routes know themselves.
			</h2>
			<p class="mt-4 text-lg leading-relaxed text-fg-muted">
				The compiler emits a five-file module graph and an ambient
				<code class="font-mono text-base text-fg">docvia/source</code>
				module. Every route key, every frontmatter field — typed end to end.
			</p>
		</div>
		<div
			class="overflow-hidden rounded-xl border border-border bg-bg-subtle shadow-[var(--shadow-sm)] md:order-1"
		>
			<div
				class="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-fg-muted"
			>
				<span class="font-mono">app/page.ts</span>
				<Terminal class="h-3.5 w-3.5" />
			</div>
			<pre
				class="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-fg"><code>{codeUsage}</code></pre>
		</div>
	</div>
</section>

<!-- Quick-start -->
<section class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-16 max-w-2xl text-center">
			<span
				class="text-xs font-medium uppercase tracking-[0.05em] text-accent"
			>
				Get going
			</span>
			<h2
				class="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Three commands.
			</h2>
		</div>

		<ol class="mx-auto grid max-w-3xl gap-4">
			{#each [{ step: "01", cmd: "pnpm add -D @docvia/cli", label: "Install the CLI." }, { step: "02", cmd: "npx docvia init", label: "Scaffold docs/ and a working config." }, { step: "03", cmd: "npx docvia build", label: "Compile your documentation." }] as { step, cmd, label }}
				<li
					class="flex flex-col gap-3 rounded-lg border border-border bg-bg-subtle p-5 sm:flex-row sm:items-center"
				>
					<span
						class="font-mono text-xs uppercase tracking-[0.1em] text-fg-muted"
					>{step}</span>
					<code
						class="flex-1 rounded-md bg-bg-muted px-3 py-2 font-mono text-sm text-fg"
					>{cmd}</code>
					<span class="text-sm text-fg-muted">{label}</span>
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- Closing CTA -->
<section class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10">
		<div
			class="rounded-2xl border border-accent/30 bg-accent-subtle px-8 py-12 text-center md:px-16 md:py-16"
		>
			<h2
				class="font-display text-3xl font-semibold tracking-tight md:text-4xl"
			>
				Ready to compile?
			</h2>
			<p class="mx-auto mt-3 max-w-xl text-fg-muted">
				docvia is open source and approaching its first public preview.
				Install today and help shape v1.0.
			</p>
			<div
				class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
			>
				<Button size="lg" href="/docs">
					Read the docs
					<ArrowRight />
				</Button>
				<Button
					variant="outline"
					size="lg"
					href="https://github.com/kanakkholwal/docvia"
				>
					Star on GitHub
				</Button>
			</div>
		</div>
	</div>
</section>
