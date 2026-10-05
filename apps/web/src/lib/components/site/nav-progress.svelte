<script lang="ts">
import { navigating } from "$app/state";

let visible = $state(false);

// Fast navigations never flash the bar.
$effect(() => {
	if (!navigating.to) {
		visible = false;
		return;
	}
	const timer = setTimeout(() => (visible = true), 150);
	return () => clearTimeout(timer);
});
</script>

{#if visible}
	<div class="pointer-events-none fixed inset-x-0 top-0 z-50 h-px overflow-hidden" aria-hidden="true">
		<div class="nav-sweep h-full w-2/5 bg-brand"></div>
	</div>
{/if}
