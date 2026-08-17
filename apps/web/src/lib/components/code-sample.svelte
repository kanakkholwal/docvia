<script lang="ts">
import { inview } from "$lib/actions/inview";
import { type SnippetName, snippets } from "$lib/snippets";
import { cn } from "$lib/utils";
import { Check, Copy } from "@lucide/svelte";
import { highlighted } from "virtual:docvia-snippets";

type Props = {
	name: SnippetName;
	/** Filename shown in the window chrome. Omit for a bare block. */
	filename?: string;
	class?: string;
};
let { name, filename, class: className }: Props = $props();

let copied = $state(false);
let shown = $state(false);

const html = $derived(highlighted[name]);
const meta = $derived(snippets[name]);
const lineCount = $derived(meta.code.split("\n").length);

async function copy() {
	try {
		await navigator.clipboard.writeText(meta.code);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	} catch {
		/* clipboard unavailable, no-op */
	}
}
</script>

<div
	use:inview
	onenter={() => (shown = true)}
	class={cn(
		"reveal overflow-hidden rounded-md border border-hairline bg-canvas",
		shown && "reveal-in",
		className,
	)}
>
	{#if filename}
		<div
			class="flex items-center justify-between gap-2 border-b border-hairline bg-surface-card px-4 py-2 font-mono text-[12px]"
		>
			<span class="flex items-center gap-1.5 text-ink">
				<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
				{filename}
			</span>
			<button
				onclick={copy}
				aria-label={copied ? "Copied" : "Copy code"}
				class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-[color,background-color,transform] duration-(--motion-fast) ease-out active:scale-[0.9] hover:bg-surface-soft hover:text-ink"
			>
				{#if copied}
					<Check class="h-3.5 w-3.5 text-check" />
				{:else}
					<Copy class="h-3.5 w-3.5" />
				{/if}
			</button>
		</div>
	{/if}

	<!-- Shiki output, generated at build time by vite-plugin-snippets. -->
	<div class="code-sample overflow-x-auto p-5 text-[13px] leading-[1.6]">
		{@html html}
	</div>

	{#if filename}
		<div
			class="flex items-center justify-between border-t border-hairline bg-surface-card px-4 py-2 font-mono text-[11px] text-muted"
		>
			<span>{meta.lang} · {lineCount} lines</span>
			<span class="flex items-center gap-1.5">
				<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
				typed
			</span>
		</div>
	{/if}
</div>

<style>
	/* Shiki emits both palettes as custom properties per token; pick the side
	   that matches the active theme so switching costs no re-highlight. */
	.code-sample :global(pre) {
		margin: 0;
		background: transparent !important;
	}

	.code-sample :global(code) {
		font-family: var(--font-mono);
		display: block;
	}

	.code-sample :global(span) {
		color: var(--shiki-light);
	}

	:global([data-theme="dark"]) .code-sample :global(span) {
		color: var(--shiki-dark);
	}
</style>
