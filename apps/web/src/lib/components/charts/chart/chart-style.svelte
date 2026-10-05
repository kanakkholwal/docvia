<script lang="ts">
import type { ChartConfig } from "./context";
import { chartStyleCss } from "./core";

let { id, config }: { id: string; config: ChartConfig } = $props();

const css = $derived(chartStyleCss(id, config));
</script>

{#if css}
	{@html `<style>${css}</style>`}
{/if}
