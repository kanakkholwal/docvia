<script lang="ts">
import { cn } from "#lib/cn.ts";
import type { Component } from "svelte";

/** The portfolio's IconRoll: on `group/roll` hover the glyph slides up and a copy rises in. */
let { icon: Icon, class: className }: { icon: Component<{ class?: string }>; class?: string } = $props();
</script>

<span aria-hidden="true" class={cn("relative inline-flex shrink-0 overflow-hidden", className)}>
	<span
		class="flex h-[200%] w-full flex-col transition-[translate] duration-(--duration-slow) ease-(--ease-out) motion-reduce:transition-none pointer-fine:group-hover/roll:-translate-y-1/2 group-focus-visible/roll:-translate-y-1/2"
	>
		<Icon class="h-1/2! w-full! shrink-0" />
		<Icon class="h-1/2! w-full! shrink-0" />
	</span>
</span>
