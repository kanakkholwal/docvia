<script lang="ts">
import { inview } from "$lib/actions/inview";
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils";
import { ArrowRight, Check, Copy } from "@lucide/svelte";

const steps = [
	{
		cmd: "pnpm add -D @docvia/cli",
		label: "Install the CLI",
		out: "+ @docvia/cli 1.0.0",
	},
	{
		cmd: "npx docvia init --renderer react",
		label: "Scaffold docs/ and a config",
		out: "created docs/ · docvia.config.ts",
	},
	{
		cmd: "npx docvia build",
		label: "Compile to a typed module graph",
		out: "3 pages · .docvia/ ready",
	},
];

let shown = $state(false);
let copiedIndex = $state<number | null>(null);

async function copy(cmd: string, i: number) {
	try {
		await navigator.clipboard.writeText(cmd);
		copiedIndex = i;
		setTimeout(() => (copiedIndex = null), 1600);
	} catch {
		/* clipboard unavailable, no-op */
	}
}
</script>

<section id="quickstart" class="border-b border-hairline bg-canvas scroll-mt-20">
	<div class="mx-auto max-w-page px-5 py-14 sm:px-10 sm:py-28">
		<div class="mb-14 text-center">
			<span class="label-meta">Quickstart</span>
			<h2
				class="mx-auto mt-4 max-w-2xl text-balance font-display text-[32px] leading-[1.05] tracking-tight text-ink sm:text-[48px] sm:leading-none"
			>
				Zero to compiled in three commands.
			</h2>
		</div>

		<!-- One terminal, three prompts. The steps are a sequence, so they read as
		     a single continuous session rather than three detached cards. -->
		<div
			use:inview
			onenter={() => (shown = true)}
			class="mx-auto max-w-2xl overflow-hidden rounded-lg border border-hairline bg-surface-soft"
		>
			<div
				class="flex items-center gap-2 border-b border-hairline bg-surface-card px-4 py-2.5"
			>
				<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-hairline-strong"></span>
				<span class="h-2.5 w-2.5 rounded-full bg-brand"></span>
				<span class="ml-2 font-mono text-[11px] text-muted">bash</span>
			</div>

			<ol class="divide-y divide-hairline">
				{#each steps as { cmd, label, out }, i}
					<li
						class={cn("group px-4 py-4 sm:px-5", shown && "step-in")}
						style="animation-delay: {i * 90}ms"
					>
						<div class="flex items-center gap-3 font-mono text-[13.5px]">
							<span aria-hidden="true" class="select-none text-brand-ink">$</span>
							<code class="flex-1 truncate text-ink">{cmd}</code>
							<button
								onclick={() => copy(cmd, i)}
								aria-label={copiedIndex === i ? "Copied" : `Copy: ${cmd}`}
								class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition-[color,background-color,transform,opacity] duration-(--motion-fast) ease-out group-hover:opacity-100 focus-visible:opacity-100 active:scale-[0.9] hover:bg-surface-card hover:text-ink"
							>
								{#if copiedIndex === i}
									<Check class="h-3.5 w-3.5 text-check" />
								{:else}
									<Copy class="h-3.5 w-3.5" />
								{/if}
							</button>
						</div>
						<div class="mt-1.5 flex items-baseline gap-3 pl-[1.35rem]">
							<span class="font-mono text-[12px] text-muted-soft">{out}</span>
							<span class="ml-auto text-[13px] text-body">{label}</span>
						</div>
					</li>
				{/each}
			</ol>
		</div>

		<div class="mt-10 text-center">
			<Button variant="ghost" href="/docs/getting-started">
				Read the getting-started guide
				<ArrowRight />
			</Button>
		</div>
	</div>
</section>

<style>
	/* Staggered so the three prompts land in the order you would type them. */
	:global(.js) .step-in {
		opacity: 0;
		animation: step-rise 0.42s var(--ease-out) forwards;
	}

	@keyframes step-rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.js) .step-in {
			opacity: 1;
			animation: none;
			transform: none;
		}
	}
</style>
