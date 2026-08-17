<script lang="ts">
import { inview } from "$lib/actions/inview";
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils";
import { ArrowRight, Check, Copy } from "@lucide/svelte";

const steps = [
	{
		label: "Install the CLI",
		cmd: "pnpm add -D @docvia/cli",
		out: "+ @docvia/cli 1.0.0",
	},
	{
		label: "Scaffold docs/ and a config",
		cmd: "npx docvia init --renderer react",
		out: "created docs/ · docvia.config.ts",
	},
	{
		label: "Compile to a typed module graph",
		cmd: "npx docvia build",
		out: "3 pages · .docvia/ ready",
	},
];

const allCommands = steps.map((s) => s.cmd).join("\n");

let shown = $state(false);
let copiedIndex = $state<number | null>(null);
let copiedAll = $state(false);

async function write(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

async function copyStep(cmd: string, i: number) {
	if (!(await write(cmd))) return;
	copiedIndex = i;
	setTimeout(() => (copiedIndex = null), 1600);
}

async function copyAll() {
	if (!(await write(allCommands))) return;
	copiedAll = true;
	setTimeout(() => (copiedAll = false), 1600);
}
</script>

<section id="quickstart" class="border-b border-hairline bg-canvas scroll-mt-20">
	<div class="mx-auto max-w-page px-5 py-14 sm:px-10 sm:py-24">
		<div class="mb-10 text-center">
			<span class="label-meta">Quickstart</span>
			<h2
				class="mx-auto mt-4 max-w-2xl text-balance font-display text-[32px] leading-[1.05] tracking-tight text-ink sm:text-[48px] sm:leading-none"
			>
				Zero to compiled in three commands.
			</h2>
		</div>

		<!-- No fake window chrome: the three-dot titlebar is decoration that says
		     nothing. A numbered rail says the real thing, that this is a sequence. -->
		<div
			use:inview
			onenter={() => (shown = true)}
			class="mx-auto max-w-2xl overflow-hidden rounded-lg border border-hairline bg-surface-soft"
		>
			<div
				class="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 sm:px-5"
			>
				<span class="font-mono text-[11px] tracking-[0.04em] text-muted">
					bash
				</span>
				<button
					onclick={copyAll}
					class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-muted transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.97] hover:bg-surface-card hover:text-ink"
				>
					{#if copiedAll}
						<Check class="h-3 w-3 text-check" />
						copied
					{:else}
						<Copy class="h-3 w-3" />
						copy all
					{/if}
				</button>
			</div>

			<ol class="px-4 py-5 sm:px-5">
				{#each steps as { label, cmd, out }, i}
					{@const last = i === steps.length - 1}
					<li class="group relative grid grid-cols-[1.75rem_1fr] gap-x-3 sm:grid-cols-[2rem_1fr]">
						<!-- Rail: node plus the connector down to the next node. -->
						<div class="relative flex justify-center">
							<span
								class={cn(
									"relative z-10 grid h-6 w-6 place-items-center rounded-full border border-hairline bg-canvas font-mono text-[10px] font-semibold text-brand-ink",
									shown && "node-in",
								)}
								style="animation-delay: {i * 130}ms"
							>
								{String(i + 1).padStart(2, "0")}
							</span>
							{#if !last}
								<span
									aria-hidden="true"
									class={cn(
										"absolute top-6 bottom-0 w-px bg-hairline-strong",
										shown && "rail-in",
									)}
									style="animation-delay: {i * 130 + 120}ms"
								></span>
							{/if}
						</div>

						<!-- Label sits with its command instead of floating to the far
						     right, where the eye had to cross the whole row to pair them. -->
						<div class={cn("min-w-0", last ? "pb-0" : "pb-6")}>
							<div
								class={cn("text-[13px] leading-6 text-body", shown && "line-in")}
								style="animation-delay: {i * 130 + 60}ms"
							>
								{label}
							</div>

							<div
								class={cn(
									"mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors duration-(--motion-base) ease-out group-hover:bg-surface-card",
									shown && "line-in",
								)}
								style="animation-delay: {i * 130 + 60}ms"
							>
								<span aria-hidden="true" class="select-none font-mono text-[13.5px] text-brand-ink">
									$
								</span>
								<code class="min-w-0 flex-1 truncate font-mono text-[13.5px] text-ink">
									{cmd}
								</code>
								<button
									onclick={() => copyStep(cmd, i)}
									aria-label={copiedIndex === i ? "Copied" : `Copy: ${cmd}`}
									class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted opacity-60 transition-[color,background-color,transform,opacity] duration-(--motion-fast) ease-out active:scale-[0.9] hover:bg-surface-soft hover:text-ink hover:opacity-100 focus-visible:opacity-100"
								>
									{#if copiedIndex === i}
										<Check class="h-3.5 w-3.5 text-check" />
									{:else}
										<Copy class="h-3.5 w-3.5" />
									{/if}
								</button>
							</div>

							<!-- Output lands after its command: the order is the causality. -->
							<div
								class={cn(
									"mt-1 pl-2.5 font-mono text-[12px] text-muted",
									shown && "out-in",
								)}
								style="animation-delay: {i * 130 + 220}ms"
							>
								{out}
							</div>
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
	/* Scroll-triggered and seen once, so a reveal earns its place here in a way
	   it would not on a control the user hits repeatedly. Everything is CSS, so
	   it stays off the main thread and honours reduced motion. */
	:global(.js) .node-in,
	:global(.js) .line-in,
	:global(.js) .out-in,
	:global(.js) .rail-in {
		opacity: 0;
		animation-duration: 0.34s;
		animation-timing-function: var(--ease-out);
		animation-fill-mode: forwards;
	}

	:global(.js) .node-in {
		animation-name: node-pop;
	}

	:global(.js) .line-in {
		animation-name: line-rise;
	}

	:global(.js) .out-in {
		animation-name: out-fade;
		animation-duration: 0.24s;
	}

	:global(.js) .rail-in {
		animation-name: rail-draw;
		transform-origin: top;
	}

	/* Starts at 0.6 rather than 0: things do not appear out of nothing. */
	@keyframes node-pop {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes line-rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes out-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes rail-draw {
		from {
			opacity: 1;
			transform: scaleY(0);
		}
		to {
			opacity: 1;
			transform: scaleY(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.js) .node-in,
		:global(.js) .line-in,
		:global(.js) .out-in,
		:global(.js) .rail-in {
			opacity: 1;
			animation: none;
			transform: none;
		}
	}
</style>
