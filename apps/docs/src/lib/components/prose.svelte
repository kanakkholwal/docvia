<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "$lib/utils";

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
		"[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-ink [&_code]:bg-surface-card [&_code]:rounded-sm [&_code]:px-1.5 [&_code]:py-0.5",
		"[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-surface-card [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed",
		"[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-ink",
		"[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:bg-surface-soft [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-body [&_blockquote]:rounded-r-md",
		"[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
		"[&_th]:border-b [&_th]:border-hairline [&_th]:py-2 [&_th]:px-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink",
		"[&_td]:border-b [&_td]:border-hairline/60 [&_td]:py-2 [&_td]:px-3 [&_td]:text-body",
		"[&_hr]:my-10 [&_hr]:border-hairline",
		className,
	)}
>
	{@render children?.()}
</div>
