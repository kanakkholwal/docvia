<script lang="ts">
import { cn } from "$lib/utils";

// A geometric `d` emitting three stepped modules: the compiler turning one
// source into a module graph. The letterform inherits currentColor so the mark
// works monochrome; only the modules carry the accent.

type Props = { class?: string; accent?: boolean };
let { class: className, accent = true }: Props = $props();
</script>

<svg
	viewBox="0 0 32 32"
	fill="none"
	aria-hidden="true"
	focusable="false"
	class={cn("shrink-0", className)}
>
	<!-- bowl -->
	<circle
		cx="9.5"
		cy="20.5"
		r="6"
		stroke="currentColor"
		stroke-width="4.2"
	/>
	<!-- stem -->
	<rect x="14.4" y="4.5" width="4.2" height="22.1" rx="2.1" fill="currentColor" />
	<!-- emitted modules, stepping down to the d's baseline -->
	<g fill={accent ? "var(--brand)" : "currentColor"}>
		<rect x="21.2" y="16.4" width="3" height="3" rx="0.6" />
		<rect x="24.8" y="20" width="3" height="3" rx="0.6" />
		<rect x="28.4" y="23.6" width="3" height="3" rx="0.6" />
	</g>
</svg>
