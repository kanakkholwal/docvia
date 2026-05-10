<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "$lib/utils";

type Props = { class?: string; children?: Snippet };
let { class: className, children }: Props = $props();
</script>

<div
	class={cn(
		"prose-docvia max-w-none text-fg",
		"[&_p]:leading-7 [&_p]:text-fg",
		"[&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline",
		"[&_strong]:text-fg [&_strong]:font-medium",
		"[&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:mb-4",
		"[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-20",
		"[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-20",
		"[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:text-fg",
		"[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5",
		"[&_p]:my-4",
		"[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:bg-bg-muted [&_code]:rounded-sm [&_code]:px-1.5 [&_code]:py-0.5",
		"[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-bg-subtle [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed",
		"[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-fg",
		"[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:bg-bg-subtle [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-fg-muted [&_blockquote]:rounded-r-md",
		"[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
		"[&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:px-3 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg-muted",
		"[&_td]:border-b [&_td]:border-border/60 [&_td]:py-2 [&_td]:px-3",
		"[&_hr]:my-10 [&_hr]:border-border",
		className,
	)}
>
	{@render children?.()}
</div>
