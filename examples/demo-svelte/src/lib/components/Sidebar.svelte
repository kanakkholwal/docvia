<script lang="ts">
import { page } from "$app/state";

interface NavItem {
	name: string;
	slug: string;
	title: string;
	children: NavItem[];
}
interface Props {
	nav: NavItem[];
}

let { nav }: Props = $props();

function isActive(slug: string): boolean {
	const currentSlug = page.params.slug?.[0] || "index";
	return currentSlug === slug || (slug === "index" && !page.params.slug);
}

function getHref(slug: string): string {
	return slug === "index" ? "/" : `/${slug}`;
}
</script>

<ul class="nav-list">
	{#each nav as item (item.slug)}
		<li class="nav-item">
			<a
				href={getHref(item.slug)}
				class="nav-link"
				class:active={isActive(item.slug)}
			>
				<span class="nav-label">{item.title}</span>
			</a>

			{#if item.children && item.children.length > 0}
				<ul class="nav-sublist">
					{#each item.children as child (child.slug)}
						<li class="nav-item">
							<a
								href={getHref(child.slug)}
								class="nav-link"
								class:active={isActive(child.slug)}
							>
								<span class="nav-label">{child.title}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.nav-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0 1rem;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
	}

	.nav-link {
		display: flex;
		align-items: center;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted-foreground);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		text-decoration: none;
		border-left: 2px solid transparent;
		margin-left: -0.25rem;
	}

	.nav-link:hover {
		color: var(--foreground);
		background-color: var(--accent);
	}

	.nav-link.active {
		color: var(--primary);
		background-color: hsl(var(--primary-h), var(--primary-s), 95%);
		font-weight: 600;
		border-left-color: var(--primary);
	}

	:global(.dark) .nav-link.active {
		background-color: hsl(var(--primary-h), var(--primary-s), 15%);
	}

	.nav-label {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-sublist {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-left: 1rem;
		margin-top: 0.25rem;
		border-left: 1px solid var(--border);
		margin-left: 0.5rem;
	}
</style>
