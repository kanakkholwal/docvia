<script lang="ts">
import { cn } from "$lib/utils";

type Size = "sm" | "md" | "lg";

type Props = {
	class?: string;
	size?: Size;
	withWordmark?: boolean;
};

let {
	class: className,
	size = "md",
	withWordmark = true,
}: Props = $props();

const dims = {
	sm: { mark: "h-6 w-6", markText: "text-[13px]", word: "text-sm" },
	md: { mark: "h-8 w-8", markText: "text-[15px]", word: "text-base" },
	lg: { mark: "h-12 w-12", markText: "text-[22px]", word: "text-2xl" },
} as const;

const d = $derived(dims[size]);
</script>

<a href="/" class={cn("group inline-flex items-center gap-2.5", className)}>
	<span
		class={cn(
			"relative grid place-items-center rounded-md bg-ink font-display font-semibold leading-none text-on-primary transition-transform duration-(--motion-fast) group-hover:-rotate-[6deg]",
			d.mark,
			d.markText,
		)}
	>
		d
		<!-- Subtle brand-color accent dot on the mark -->
		<span
			class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand-coral"
			aria-hidden="true"
		></span>
	</span>
	{#if withWordmark}
		<span
			class={cn(
				"font-display font-semibold text-ink",
				d.word,
			)}
			style="letter-spacing: -0.025em;"
		>
			docvia
		</span>
	{/if}
</a>
