<script lang="ts">
	import { onMount } from "svelte";

	interface Heading {
		depth: number;
		text: string;
		id: string;
	}

	let headings = $state<Heading[]>([]);
	let activeId = $state<string | null>(null);

	onMount(() => {
		// Extract headings from the rendered content
		const article = document.querySelector(".article-inner");
		if (!article) return;

		const headingElements = article.querySelectorAll("h2, h3");
		const extractedHeadings: Heading[] = [];

		headingElements.forEach((element, index) => {
			const depth = parseInt(element.tagName[1]);
			const text = element.textContent || "";
			let id = element.id;

			if (!id) {
				id = `heading-${index}`;
				element.id = id;
			}

			extractedHeadings.push({ depth, text, id });
		});

		headings = extractedHeadings;

		// Set up intersection observer for active heading
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				});
			},
			{ rootMargin: "-100px 0px -66%" },
		);

		headingElements.forEach((element) => {
			observer.observe(element);
		});

		return () => {
			observer.disconnect();
		};
	});

	const filteredHeadings = $derived(
		headings.filter((h) => h.depth === 2 || h.depth === 3),
	);

	function handleLinkClick(id: string) {
		activeId = id;
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	}
</script>

<nav class="toc-nav" aria-label="Table of contents">
	<div class="toc-header">
		<h3 class="toc-title">On this page</h3>
	</div>

	<ul class="toc-list">
		{#each filteredHeadings as heading (heading.id)}
			<li class="toc-item" class:nested={heading.depth === 3}>
				<a
					href="#{heading.id}"
					class="toc-link"
					class:active={activeId === heading.id}
					onclick={() => handleLinkClick(heading.id)}
				>
					<span class="toc-text">{heading.text}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<nav class="toc-nav" aria-label="Table of contents">
	<div class="toc-header">
		<h3 class="toc-title">On this page</h3>
	</div>

	<ul class="toc-list">
		{#each filteredHeadings as heading (heading.id)}
			<li class="toc-item" class:nested={heading.depth === 3}>
				<a
					href="#{heading.id}"
					class="toc-link"
					class:active={activeId === heading.id}
					onclick={() => handleLinkClick(heading.id)}
				>
					<span class="toc-text">{heading.text}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.toc-nav {
		font-size: 0.875rem;
	}

	.toc-header {
		margin-bottom: 1rem;
	}

	.toc-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted-foreground);
		margin: 0;
	}

	.toc-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0;
		margin: 0;
	}

	.toc-item {
		display: flex;
		padding-left: 0;
	}

	.toc-item.nested {
		padding-left: 0.75rem;
	}

	.toc-link {
		display: flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		color: var(--muted-foreground);
		text-decoration: none;
		border-left: 2px solid transparent;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.toc-link:hover {
		color: var(--foreground);
		background-color: var(--accent);
		border-left-color: var(--primary);
	}

	.toc-link.active {
		color: var(--primary);
		border-left-color: var(--primary);
		background-color: hsl(var(--primary-h), var(--primary-s), 95%);
	}

	:global(.dark) .toc-link.active {
		background-color: hsl(var(--primary-h), var(--primary-s), 15%);
	}

	.toc-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.toc-nav {
		font-size: 0.875rem;
	}

	.toc-header {
		margin-bottom: 1rem;
	}

	.toc-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted-foreground);
		margin: 0;
	}

	.toc-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0;
		margin: 0;
	}

	.toc-item {
		display: flex;
		padding-left: 0;
	}

	.toc-item.nested {
		padding-left: 0.75rem;
	}

	.toc-link {
		display: flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		color: var(--muted-foreground);
		text-decoration: none;
		border-left: 2px solid transparent;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.toc-link:hover {
		color: var(--foreground);
		background-color: var(--accent);
		border-left-color: var(--primary);
	}

	.toc-link.active {
		color: var(--primary);
		border-left-color: var(--primary);
		background-color: hsl(var(--primary-h), var(--primary-s), 95%);
	}

	:global(.dark) .toc-link.active {
		background-color: hsl(var(--primary-h), var(--primary-s), 15%);
	}

	.toc-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
