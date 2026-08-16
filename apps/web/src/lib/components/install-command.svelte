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
		"inline-flex w-full max-w-md flex-col overflow-hidden rounded-md border border-hairline bg-surface-soft text-left",
		className,
	)}
>
	<!-- Manager tabs — low-contrast, underline indicator instead of a fill. -->
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
					"relative px-3 py-2.5 text-[13px] font-medium transition-colors duration-(--motion-fast) ease-out after:absolute after:inset-x-2 after:-bottom-px after:h-px after:transition-colors after:duration-(--motion-fast)",
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
	<div class="flex items-center gap-3 px-4 py-3 font-mono text-[13.5px]">
		<span class="select-none text-brand-ink">$</span>
		<code class="flex-1 truncate text-ink">{command}</code>
		<button
			onclick={copy}
			aria-label={copied ? "Copied" : "Copy install command"}
			class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.9] hover:bg-surface-card hover:text-ink"
		>
			{#if copied}
				<Check class="h-3.5 w-3.5 text-check" />
			{:else}
				<Copy class="h-3.5 w-3.5" />
			{/if}
		</button>
	</div>
</div>
