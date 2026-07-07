<script lang="ts">
import { ArrowRight } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

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

<section id="quickstart" class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<div class="mb-16 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
			>
				Quickstart
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-[56px] lg:leading-[1.05]"
				style="letter-spacing: -0.03em;"
			>
				Zero to compiled in under a minute.
			</h2>
		</div>

		<ol class="mx-auto grid max-w-3xl gap-3">
			{#each steps as { step, cmd, label }}
				<li
					class="flex flex-col gap-3 rounded-lg bg-surface-card p-5 sm:flex-row sm:items-center"
				>
					<span
						class="font-mono text-[11px] font-semibold uppercase tracking-widest text-brand-ink sm:w-10"
					>
						{step}
					</span>
					<code
						class="flex-1 rounded-md bg-canvas px-3 py-2 font-mono text-[14px] text-ink"
					>
						{cmd}
					</code>
					<span class="text-[14px] text-body sm:max-w-[18rem]">
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
