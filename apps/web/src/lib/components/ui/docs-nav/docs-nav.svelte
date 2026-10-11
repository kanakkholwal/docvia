<script lang="ts">
import Collapsible from "#lib/components/ui/collapsible/collapsible.svelte";
import CollapsibleContent from "#lib/components/ui/collapsible/collapsible-content.svelte";
import CollapsibleTrigger from "#lib/components/ui/collapsible/collapsible-trigger.svelte";
import { cn } from "#lib/cn.js";
import DocsNavList from "./docs-nav-list.svelte";
import { revealCurrent } from "./scroll";
import type { DocsNavSection } from "./types";
import { type DocsNavConnector, docsNav } from "./variants";

let {
	sections,
	current,
	open = $bindable(),
	onOpenChange,
	connector = "tick",
	rungs = false,
	onNavigate,
	label = "Documentation",
	class: className,
}: {
	sections: DocsNavSection[];
	/** href of the page being viewed; that link is marked current. */
	current?: string;
	/** Ids of the expanded sections; bindable. Every section when omitted. */
	open?: string[];
	onOpenChange?: (open: string[]) => void;
	connector?: DocsNavConnector;
	/** Adds a continuous hairline ladder beside the links; works with either connector. */
	rungs?: boolean;
	/** Fires on link click, e.g. to close a mobile drawer or route client-side. */
	onNavigate?: (href: string, event: MouseEvent) => void;
	/** Accessible name of the navigation landmark. */
	label?: string;
	class?: string;
} = $props();

let root = $state<HTMLElement>();
const styles = $derived(docsNav({ connector }));
const expanded = $derived(open ?? sections.map((s) => s.id));

function setSection(id: string, next: boolean) {
	const list = next
		? [...expanded.filter((o) => o !== id), id]
		: expanded.filter((o) => o !== id);
	open = list;
	onOpenChange?.(list);
}

$effect(() => {
	void current;
	revealCurrent(root);
});
</script>

<nav bind:this={root} aria-label={label} data-slot="docs-nav" class={cn(styles.root(), className)}>
	{#each sections as section (section.id)}
		<Collapsible
			class={styles.section()}
			bind:open={() => expanded.includes(section.id), (next) => setSection(section.id, next)}
		>
			<CollapsibleTrigger class={styles.trigger()}>
				{section.label}
				{#if section.count !== undefined}
					<span class={styles.count()}>{section.count}</span>
				{/if}
			</CollapsibleTrigger>
			<CollapsibleContent class={styles.content()}>
				<DocsNavList items={section.items} {current} {connector} {rungs} {onNavigate} />
			</CollapsibleContent>
		</Collapsible>
	{/each}
</nav>
