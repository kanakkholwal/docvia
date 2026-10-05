<script lang="ts">
import Github from "#lib/components/icons/github.svelte";
import InitTerminal from "#lib/components/site/init-terminal.svelte";
import WorkersBadge from "#lib/components/site/workers-badge.svelte";
import { TextLoop } from "#lib/components/text/text-loop/index.ts";
import { Button } from "#lib/components/ui/button/index.ts";
import { ArrowRight } from "@lucide/svelte";
import { siNextdotjs, siSvelte, siTanstack } from "simple-icons";

const lines = [
	{ words: ["Markdown", "docs,"], pixel: false },
	{ words: ["built", "into", "your", "app."], pixel: true },
];
const hosts = [
	{ name: "Next.js", path: siNextdotjs.path },
	{ name: "SvelteKit", path: siSvelte.path },
	{ name: "TanStack Start", path: siTanstack.path },
];
</script>

{#snippet arrow(cls: string)}
	<span class="icon-roll {cls}" aria-hidden="true">
		<span><ArrowRight class="size-full" /><ArrowRight class="-ml-[100%] size-full -translate-x-full" /></span>
	</span>
{/snippet}

<section class="mx-auto max-w-page px-5 pt-14 sm:px-10 sm:pt-20 lg:px-16">
	<div class="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
		<div class="flex flex-col max-lg:items-center max-lg:text-center">
			<div class="rise">
				<WorkersBadge href="/#workers" label="Built for Cloudflare Workers" />
			</div>

			<h1 class="mt-7 font-display text-5xl leading-[1.05] tracking-tighter text-ink sm:text-6xl lg:text-[3.25rem] xl:text-6xl">
				{#each lines as line, l}
					<span class="block lg:whitespace-nowrap {line.pixel ? 'font-pixel tracking-normal' : ''}">
						{#each line.words as word, w}
							<span class="word {line.pixel && w >= 2 ? 'text-brand-ink' : ''}" style="--i: {l * 2 + w}"
								>{word}</span
							>{" "}
						{/each}
					</span>
				{/each}
			</h1>

			<p class="rise mt-6 max-w-md text-lg text-body" style="--i: 5">
				Collections, a page tree, typed frontmatter and search, compiled into
				<TextLoop items={["Next.js", "SvelteKit", "TanStack Start"]} intervalMs={2400} class="font-pixel text-ink" />
			</p>

			<div class="rise mt-8 flex flex-wrap items-center gap-3 max-lg:justify-center" style="--i: 6">
				<Button href="/docs/getting-started" size="lg" class="group">
					Get started
					{@render arrow("size-4")}
				</Button>
				<Button href="https://github.com/kanakkholwal/docvia" variant="secondary" size="lg">
					<Github />
					GitHub
				</Button>
			</div>

			<div class="rise mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted max-lg:justify-center" style="--i: 7">
				<span>Works with</span>
				{#each hosts as host}
					<span class="inline-flex items-center gap-1.5 text-body">
						<svg viewBox="0 0 24 24" class="size-3.5 fill-current" aria-hidden="true"><path d={host.path} /></svg>
						{host.name}
					</span>
				{/each}
			</div>
		</div>

		<div class="rise min-w-0" style="--i: 6">
			<InitTerminal />
		</div>
	</div>
</section>
