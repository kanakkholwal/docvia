<script lang="ts">
import { Check, Copy } from "@lucide/svelte";
import { cn } from "#lib/utils.ts";

// `args` runs a package without installing it; init installs what the app needs itself.
type Props = { pkg?: string; args?: string; class?: string };
let { pkg = "@docvia/cli", args = "init", class: className }: Props = $props();

const managers = [
	{ id: "npm", cmd: (p: string, a: string) => `npx ${p} ${a}` },
	{ id: "pnpm", cmd: (p: string, a: string) => `pnpm dlx ${p} ${a}` },
	{ id: "bun", cmd: (p: string, a: string) => `bunx ${p} ${a}` },
	{ id: "yarn", cmd: (p: string, a: string) => `yarn dlx ${p} ${a}` },
] as const;

let active = $state<(typeof managers)[number]["id"]>("npm");
let copied = $state(false);

const command = $derived(
	managers.find((m) => m.id === active)!.cmd(pkg, args),
);

async function copy() {
	try {
		await navigator.clipboard.writeText(command);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	} catch {
		/* clipboard unavailable, no-op */
	}
}
</script>

<div
	class={cn(
		"install inline-flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-hairline bg-surface-soft text-left",
		className,
	)}
>
	<!-- Manager tabs, low-contrast, underline indicator instead of a fill. -->
	<div
		role="tablist"
		aria-label="Package manager"
		class="flex items-center border-b border-hairline px-2"
	>
		{#each managers as m (m.id)}
			<button
				role="tab"
				aria-selected={active === m.id}
				onclick={() => (active = m.id)}
				class={cn(
					"relative px-3 py-2.5 text-sm font-medium transition-colors duration-(--duration-fast) ease-out after:absolute after:inset-x-2 after:-bottom-px after:h-px after:transition-colors after:duration-(--duration-fast)",
					active === m.id
						? "text-ink after:bg-brand"
						: "text-muted after:bg-transparent hover:text-body",
				)}
			>
				{m.id}
			</button>
		{/each}
	</div>

	<!-- Command + copy -->
	<div class="flex items-center gap-3 px-4 py-3 font-mono text-sm">
		<span class="select-none text-brand-ink">$</span>
		<code class="flex-1 truncate text-ink">{command}</code>
		<button
			onclick={copy}
			aria-label={copied ? "Copied" : "Copy install command"}
			class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-[color,background-color,scale] duration-(--duration-fast) ease-out active:scale-(--press-scale-icon) hover:bg-surface-card hover:text-ink"
		>
			<span class="relative size-3.5">
				<Copy class="swap absolute inset-0 size-3.5" data-on={!copied} />
				<Check class="swap absolute inset-0 size-3.5 text-success" data-on={copied} />
			</span>
		</button>
	</div>
</div>

<style>
	/* Icon swap: both stay mounted and crossfade through a slight blur and scale. */
	.install :global(.swap) {
		transition:
			opacity var(--duration-base) var(--ease-out),
			scale var(--duration-base) var(--ease-out),
			filter var(--duration-base) var(--ease-out);
	}
	.install :global(.swap[data-on="false"]) {
		opacity: 0;
		scale: 0.6;
		filter: blur(2px);
	}
</style>
