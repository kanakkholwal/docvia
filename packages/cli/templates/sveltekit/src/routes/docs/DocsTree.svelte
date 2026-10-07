<script lang="ts">
	import type { PageTree } from '@docvia/source';
	import DocsFolder from './DocsFolder.svelte';

	let { nodes, activePath }: { nodes: PageTree.Node[]; activePath: string } = $props();
</script>

<ul>
	<!-- Separators and folders have no id, and siblings may share a name. -->
	{#each nodes as node, i (node.type === 'page' ? node.url : `${node.type}-${i}`)}
		<li>
			{#if node.type === 'page'}
				<a href={node.url} aria-current={activePath === node.url ? 'page' : undefined}>
					{node.name}
				</a>
			{:else if node.type === 'folder'}
				<DocsFolder folder={node} {activePath} />
			{:else}
				<div class="docs-folder">{node.name}</div>
			{/if}
		</li>
	{/each}
</ul>
