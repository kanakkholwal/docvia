<script lang="ts">
import Badge from "#lib/components/ui/badge/badge.svelte";
import type { DocsNavItem } from "./types";
import { type DocsNavConnector, docsNav, markerWidth, rowState } from "./variants";

let {
	items,
	current,
	connector,
	rungs,
	onNavigate,
}: {
	items: DocsNavItem[];
	current?: string;
	connector: DocsNavConnector;
	rungs: boolean;
	onNavigate?: (href: string, event: MouseEvent) => void;
} = $props();

let list = $state<HTMLDivElement>();
let hovered = $state<number | null>(null);
let pill = $state<{ top: number; height: number } | null>(null);

function onEnter(event: PointerEvent, index: number) {
	if (!list) return;
	const row = (event.currentTarget as HTMLElement).getBoundingClientRect();
	const box = list.getBoundingClientRect();
	hovered = index;
	pill = { top: row.top - box.top, height: row.height };
}
</script>

<div
	bind:this={list}
	role="presentation"
	class={docsNav({ connector }).list()}
	onpointerleave={() => (hovered = null)}
>
	{#if pill}
		<div
			aria-hidden="true"
			class={docsNav({ connector, hovering: hovered !== null }).pill()}
			style:transform="translateY({pill.top}px)"
			style:height="{pill.height}px"
		></div>
	{/if}
	{#each items as item, index (item.href)}
		{@const active = item.href === current}
		{@const state = rowState(active, hovered === index, hovered !== null)}
		{@const styles = docsNav({ connector, rungs, state })}
		<div class={styles.row()}>
			<span
				aria-hidden="true"
				class={styles.marker()}
				style:width="{markerWidth(connector, rungs, state)}px"
			></span>
			{#if connector === "curve" && index < items.length - 1}
				<span aria-hidden="true" class={styles.rail()}></span>
			{/if}
			<a
				href={item.href}
				aria-current={active ? "page" : undefined}
				onclick={(event) => onNavigate?.(item.href, event)}
				onpointerenter={(event) => onEnter(event, index)}
				class={styles.link()}
			>
				<span class={styles.label()}>{item.label}</span>
				{#if item.badge}
					<Badge size="sm" variant={item.badgeVariant} class={styles.badge()}>
						{item.badge}
					</Badge>
				{/if}
			</a>
		</div>
	{/each}
</div>
