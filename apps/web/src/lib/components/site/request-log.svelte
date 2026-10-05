<script lang="ts">
// The request that failed, as it happened: no invented commands, just method, path and outcome.
let { path, status, message }: { path: string; status: number; message: string } = $props();
const notFound = $derived(status === 404);
</script>

<div class="rounded-2xl bg-well-rim p-1 shadow-surface">
	<div class="flex items-center justify-between px-3 pt-1.5 pb-2 font-mono text-xs text-muted">
		<span>request</span>
		<span class="flex items-center gap-1.5">
			<span class="size-1.5 rounded-full {notFound ? 'bg-warning' : 'bg-error'}"></span>{status}
		</span>
	</div>
	<div class="overflow-x-auto rounded-xl bg-well-body p-5 font-mono text-[13px] leading-[1.7] ring-1 ring-ink/[0.04] [&>p]:whitespace-pre">
		<p><span class="text-muted">GET</span> <span class="text-ink">{path}</span></p>
		<p><span class="text-muted">│</span></p>
		{#if notFound}
			<p><span class="text-warning">◇</span>  <span class="text-ink">no page at this path</span></p>
			<p><span class="text-muted">│</span>  <span class="text-muted">docs live under</span> <span class="text-brand-ink">/docs</span></p>
		{:else}
			<p><span class="text-error">■</span>  <span class="text-ink">the page failed to render</span></p>
			<p><span class="text-muted">│</span>  <span class="text-muted">{message}</span></p>
		{/if}
		<p><span class="text-muted">└</span>  <span class="text-muted">{status}</span></p>
	</div>
</div>
