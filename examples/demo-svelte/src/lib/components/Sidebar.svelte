<script lang="ts">
import { page } from "$app/state";

interface Props {
	nav: any[];
}

let { nav }: Props = $props();

function isActive(url: string): boolean {
	const current = `/${page.params.slug ?? ""}`;
	return current === url || (!page.params.slug && url === "/");
}
</script>

<ul class="nav-list">
	{#each nav as item (item.$id ?? item.name)}
		{#if item.type === "separator"}
			<li class="nav-section">
				<span class="nav-section-label">{item.name}</span>
			</li>
		{:else if item.type === "folder"}
			<li class="nav-section">
				<span class="nav-folder-label">{item.name}</span>
				{#if item.children?.length}
					<ul class="nav-children">
						{#if item.index}
							<li>
								<a href={item.index.url} class="nav-link" class:nav-link--active={isActive(item.index.url)}>
									Overview
								</a>
							</li>
						{/if}
						{#each item.children as child (child.$id ?? child.name)}
							{#if child.type === "page"}
								<li>
									<a href={child.url} class="nav-link" class:nav-link--active={isActive(child.url)}>
										{child.name}
									</a>
								</li>
							{/if}
						{/each}
					</ul>
				{/if}
			</li>
		{:else}
			<li>
				<a href={item.url} class="nav-link" class:nav-link--active={isActive(item.url)}>
					{item.name}
				</a>
			</li>
		{/if}
	{/each}
</ul>

<style>
	.nav-list {
		list-style: none;
	}

	.nav-section {
		margin-bottom: 4px;
	}

	.nav-section-label,
	.nav-folder-label {
		display: block;
		padding: 6px 12px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted-fg);
		margin-top: 16px;
		margin-bottom: 2px;
	}

	.nav-children {
		list-style: none;
		padding-left: 8px;
		margin-left: 12px;
		border-left: 1px solid var(--border);
	}

	.nav-link {
		display: block;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		color: var(--muted);
		transition: color var(--transition), background var(--transition);
		text-decoration: none;
	}

	.nav-link:hover {
		color: var(--fg);
		background: var(--surface);
	}

	.nav-link--active {
		color: var(--fg);
		background: var(--surface);
		font-weight: 500;
	}
</style>
