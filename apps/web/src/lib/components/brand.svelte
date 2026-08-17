<script lang="ts">
import LogoMark from "$lib/components/logo-mark.svelte";
import { cn } from "$lib/utils";

type Size = "sm" | "md" | "lg";

type Props = {
	class?: string;
	size?: Size;
	/** Mark only, no wordmark. For tight spots. */
	markOnly?: boolean;
};

let { class: className, size = "md", markOnly = false }: Props = $props();

// Tracking tightens as the wordmark grows, so it reads as one shape at every
// size rather than a set of loose letters. The mark is set slightly larger
// than the cap height so the two optically align.
const dims = {
	sm: { mark: "h-6 w-6", text: "text-[19px]", tracking: "-0.02em", gap: "gap-2" },
	md: { mark: "h-7 w-7", text: "text-[22px]", tracking: "-0.025em", gap: "gap-2.5" },
	lg: { mark: "h-10 w-10", text: "text-[32px]", tracking: "-0.03em", gap: "gap-3" },
} as const;

const d = $derived(dims[size]);
</script>

<a
	href="/"
	aria-label="docvia home"
	class={cn(
		"inline-flex w-fit items-center text-ink transition-opacity duration-(--motion-fast) ease-out hover:opacity-80",
		d.gap,
		className,
	)}
>
	<LogoMark class={d.mark} />
	{#if !markOnly}
		<span
			class={cn("font-display font-semibold", d.text)}
			style="letter-spacing: {d.tracking};"
		>
			docvia
		</span>
	{/if}
</a>
