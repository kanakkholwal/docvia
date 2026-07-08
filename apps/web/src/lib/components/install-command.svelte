<script lang="ts">
import { Check, Copy } from "@lucide/svelte";
import { cn } from "$lib/utils";

// Package-manager install widget — the developer-tool signature (npm / pnpm /
// bun / yarn tabs + a copy button), patterned on vite.dev's hero command.
type Props = { pkg?: string; dev?: boolean; class?: string };
let { pkg = "docvia", dev = true, class: className }: Props = $props();

const managers = [
	{ id: "npm", cmd: (p: string, d: boolean) => `npm i ${d ? "-D " : ""}${p}` },
	{ id: "pnpm", cmd: (p: string, d: boolean) => `pnpm add ${d ? "-D " : ""}${p}` },
	{ id: "bun", cmd: (p: string, d: boolean) => `bun add ${d ? "-d " : ""}${p}` },
	{ id: "yarn", cmd: (p: string, d: boolean) => `yarn add ${d ? "-D " : ""}${p}` },
] as const;

let active = $state<(typeof managers)[number]["id"]>("npm");
let copied = $state(false);

const command = $derived(
	managers.find((m) => m.id === active)!.cmd(pkg, dev),
);

async function copy() {
	try {
		await navigator.clipboard.writeText(command);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	} catch {
		/* clipboard unavailable — no-op */
	}
}
</script>

<div
	class={cn(
		"inline-flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-hairline bg-surface-soft text-left",
		className,
	)}
>
	<!-- Manager tabs -->
	<div
		role="tablist"
		aria-label="Package manager"
		class="flex items-center gap-0.5 border-b border-hairline px-1.5 pt-1.5"
	>
		{#each managers as m (m.id)}
			<button
				role="tab"
				aria-selected={active === m.id}
				onclick={() => (active = m.id)}
				class={cn(
					"rounded-t-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-(--motion-fast)",
					active === m.id
						? "bg-surface-card text-ink"
						: "text-muted hover:text-body",
				)}
			>
				{m.id}
			</button>
		{/each}
	</div>

	<!-- Command + copy -->
	<div class="flex items-center gap-3 px-4 py-3 font-mono text-[13.5px]">
		<span class="select-none text-brand-ink">$</span>
		<code class="flex-1 truncate text-ink">{command}</code>
		<button
			onclick={copy}
			aria-label={copied ? "Copied" : "Copy install command"}
			class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-(--motion-fast) hover:bg-surface-card hover:text-ink"
		>
			{#if copied}
				<Check class="h-3.5 w-3.5 text-check" />
			{:else}
				<Copy class="h-3.5 w-3.5" />
			{/if}
		</button>
	</div>
</div>
