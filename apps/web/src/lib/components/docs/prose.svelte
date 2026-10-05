<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "#lib/utils.ts";

type Props = { class?: string; children?: Snippet };
let { class: className, children }: Props = $props();
</script>

<div
	class={cn(
		"prose-docvia max-w-none text-body",
		"[&_p]:leading-7 [&_p]:text-body",
		"[&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-brand [&_a]:decoration-2 hover:[&_a]:decoration-ink",
		"[&_strong]:text-ink [&_strong]:font-semibold",
		"[&_h1]:font-display [&_h1]:text-4xl [&_h1]:text-ink [&_h1]:tracking-[-0.035em] [&_h1]:mb-4",
		"[&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-24",
		"[&_h3]:font-display [&_h3]:text-xl [&_h3]:text-ink [&_h3]:tracking-[-0.02em] [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-24",
		"[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:text-body",
		"[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5",
		"[&_li]:marker:text-muted",
		"[&_p]:my-4",
		"[&_code]:font-mono [&_code]:text-[0.875em] [&_code]:text-ink [&_code]:bg-surface-card [&_code]:rounded-sm [&_code]:px-1.5 [&_code]:py-0.5",
		"[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-surface-card [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed",
		"[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-ink",
		"[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:bg-surface-soft [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-body [&_blockquote]:rounded-r-md",
		"[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
		"[&_th]:border-b [&_th]:border-hairline [&_th]:py-2 [&_th]:px-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink",
		"[&_td]:border-b [&_td]:border-hairline/60 [&_td]:py-2 [&_td]:px-3 [&_td]:text-body",
		"[&_hr]:my-10 [&_hr]:border-dashed [&_hr]:border-hairline-strong",
		className,
	)}
>
	{@render children?.()}
</div>

<style>
	/* Code sits in a Well like the home page; tokens carry both Shiki palettes and follow the theme. */
	.prose-docvia :global(pre.shiki) {
		background-color: var(--well-body);
		border: 4px solid var(--well-rim);
		border-radius: var(--radius-xl);
	}

	.prose-docvia :global([data-docvia-code]) {
		position: relative;
	}

	/* renderer-core's copy button: quiet until the block is hovered, always shown on touch. */
	.prose-docvia :global(.docvia-copy) {
		position: absolute;
		top: 0.625rem;
		right: 0.625rem;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-md);
		background: var(--well-rim);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		transition:
			opacity var(--duration-fast) var(--ease-out),
			color var(--duration-fast) var(--ease-out),
			scale var(--duration-fast) var(--ease-out);
	}

	.prose-docvia :global(.docvia-copy:hover) {
		color: var(--ink);
	}

	.prose-docvia :global(.docvia-copy:active) {
		scale: var(--press-scale-sm);
	}

	.prose-docvia :global(.docvia-copy[data-copied]) {
		color: var(--success);
	}

	@media (hover: hover) and (pointer: fine) {
		.prose-docvia :global(.docvia-copy) {
			opacity: 0;
		}

		.prose-docvia :global([data-docvia-code]:hover .docvia-copy),
		.prose-docvia :global(.docvia-copy:focus-visible),
		.prose-docvia :global(.docvia-copy[data-copied]) {
			opacity: 1;
		}
	}

	.prose-docvia :global(pre.shiki span) {
		color: var(--shiki-light);
	}

	:global([data-theme="dark"]) .prose-docvia :global(pre.shiki span) {
		color: var(--shiki-dark);
	}
</style>
