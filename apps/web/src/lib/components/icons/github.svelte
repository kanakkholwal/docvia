<script lang="ts">
import { siGithub } from "simple-icons";
import type { SVGAttributes } from "svelte/elements";

// Lucide 1.x dropped brand icons; this keeps its call signature.
let {
	size = 24,
	class: className = "",
	...rest
}: SVGAttributes<SVGSVGElement> & { size?: number | string } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="currentColor"
	class={className}
	aria-hidden="true"
	{...rest}
>
	<path d={siGithub.path} />
</svg>
