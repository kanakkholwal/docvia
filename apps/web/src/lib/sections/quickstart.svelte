<script lang="ts">
import BentoCard from "#lib/components/site/bento-card.svelte";
import Section from "#lib/components/site/section.svelte";
import InstallCommand from "#lib/components/install-command.svelte";
import { SquareTerminal } from "@lucide/svelte";
import { siNextdotjs, siSvelte, siTanstack } from "simple-icons";

// Abridged from `docvia init` on a fresh create-next-app: 11 planned files plus next.config.ts and globals.css.
const transcript = [
	{ dim: "framework", text: "Next.js" },
	{ dim: "packages ", text: "pnpm (lockfile)" },
	{ dim: "content  ", text: "content/docs" },
	{ dim: "routes   ", text: "app/docs/" },
];

const hosts = [
	{ name: "Next.js", note: "build/next, webpack and Turbopack", path: siNextdotjs.path },
	{ name: "SvelteKit", note: "build/vite", path: siSvelte.path },
	{ name: "TanStack Start", note: "build/vite", path: siTanstack.path },
	{ name: "Standalone", note: "docvia build, no framework", path: "" },
];
</script>

<Section id="quickstart" number={4} title="start in one command." description="Run init in an app you already have. It finds your framework, writes the docs routes and installs what they need.">
	<div class="grid gap-3 lg:grid-cols-5">
		<BentoCard title="init writes the routes and patches your config" description="Output from a fresh create-next-app." class="lg:col-span-3" bodyClass="p-0">
			<InstallCommand class="max-w-none rounded-none border-0 border-b border-dashed border-hairline-strong bg-transparent" />
			<div class="overflow-x-auto p-5 font-mono text-sm leading-6">
				{#each transcript as line}
					<p><span class="text-muted">{line.dim}</span>  <span class="text-ink">{line.text}</span></p>
				{/each}
				<p class="mt-3 text-muted">13 file(s)</p>
				<p><span class="text-success">+</span> <span class="text-ink">app/docs/[[...slug]]/page.tsx</span></p>
				<p><span class="text-success">+</span> <span class="text-ink">content/docs/index.md</span></p>
				<p class="text-muted">...</p>
				<p class="mt-3"><span class="text-brand-ink">pnpm dev</span> <span class="text-muted">then open</span> <span class="text-brand-ink">http://localhost:3000/docs</span></p>
			</div>
		</BentoCard>

		<BentoCard title="Where it runs" description="Rendered with React or Svelte." class="lg:col-span-2">
			<ul class="divide-y divide-dashed divide-hairline-strong">
				{#each hosts as host}
					<li class="flex items-center gap-3 py-3">
						{#if host.path}
							<svg viewBox="0 0 24 24" class="size-4 shrink-0 fill-ink" aria-hidden="true"><path d={host.path} /></svg>
						{:else}
							<SquareTerminal class="size-4 shrink-0 text-ink" />
						{/if}
						<span class="text-sm text-ink">{host.name}</span>
						<span class="ml-auto truncate font-mono text-xs text-muted">{host.note}</span>
					</li>
				{/each}
			</ul>
		</BentoCard>
	</div>
</Section>
