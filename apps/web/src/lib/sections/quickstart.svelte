<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { ArrowRight } from "@lucide/svelte";

	const steps = [
		{
			step: "01",
			cmd: "pnpm add -D @docvia/cli",
			label: "Install the CLI as a dev dependency.",
		},
		{
			step: "02",
			cmd: "npx docvia init --renderer react",
			label: "Scaffold a docs/ directory and a working config.",
		},
		{
			step: "03",
			cmd: "npx docvia build",
			label: "Compile your documentation into a typed module graph.",
		},
	];
</script>

<section id="quickstart" class="border-t border-border/60 bg-bg-subtle/30">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-16 max-w-2xl text-center">
			<Badge variant="accent" class="mb-4">Quickstart</Badge>
			<h2
				class="font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				From zero to compiled in under a minute.
			</h2>
		</div>

		<ol class="mx-auto grid max-w-3xl gap-4">
			{#each steps as { step, cmd, label }}
				<li
					class="group flex flex-col gap-3 rounded-lg border border-border bg-bg-subtle p-5 transition-colors hover:border-accent/30 sm:flex-row sm:items-center"
				>
					<span
						class="font-mono text-xs uppercase tracking-[0.1em] text-fg-muted sm:w-10"
					>
						{step}
					</span>
					<code
						class="flex-1 rounded-md bg-bg-muted px-3 py-2 font-mono text-sm text-fg"
					>
						{cmd}
					</code>
					<span class="text-sm text-fg-muted sm:max-w-[18rem]">
						{label}
					</span>
				</li>
			{/each}
		</ol>

		<div class="mt-10 text-center">
			<Button variant="ghost" href="/docs/getting-started">
				Read the full guide
				<ArrowRight />
			</Button>
		</div>
	</div>
</section>
