<script lang="ts">
	import { cn } from "$lib/utils";

	type Props = {
		class?: string;
	};
	let { class: className }: Props = $props();
</script>

<a href="/" class={cn("group inline-flex items-center gap-2", className)}>
	<span
		class="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg font-display text-base font-semibold leading-none transition-transform duration-[var(--motion-fast)] group-hover:-rotate-6"
	>
		d
	</span>
	<span class="font-display text-base font-semibold tracking-tight">
		docvia
	</span>
</a>
