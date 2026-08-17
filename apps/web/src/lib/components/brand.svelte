<script lang="ts">
import { cn } from "$lib/utils";

type Size = "sm" | "md" | "lg";

type Props = {
	class?: string;
	size?: Size;
};

let { class: className, size = "md" }: Props = $props();

// Tracking tightens as the wordmark grows, so it reads as one shape at every
// size rather than a set of loose letters.
const dims = {
	sm: { text: "text-[19px]", tracking: "-0.02em" },
	md: { text: "text-[22px]", tracking: "-0.025em" },
	lg: { text: "text-[32px]", tracking: "-0.03em" },
} as const;

const d = $derived(dims[size]);
</script>

<a
	href="/"
	aria-label="docvia home"
	class={cn(
		"inline-flex w-fit items-baseline font-display font-semibold text-ink transition-opacity duration-(--motion-fast) ease-out hover:opacity-80",
		d.text,
		className,
	)}
	style="letter-spacing: {d.tracking};"
>
	docvia<span aria-hidden="true" class="text-brand">.</span>
</a>
