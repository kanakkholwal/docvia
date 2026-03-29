<script lang="ts">
    interface Heading {
        depth: number;
        text: string;
        id: string;
    }

    let { headings = [] } = $props<{ headings?: Heading[] }>();

    // Only show H2 and H3 in TOC
    const filteredHeadings = $derived(
        headings.filter((h: Heading) => h.depth === 2 || h.depth === 3),
    );
</script>

<aside class="toc">
    <div class="toc-container">
        <h4 class="toc-title">On this page</h4>
        <ul class="toc-list">
            {#each filteredHeadings as heading}
                <li
                    class="toc-item"
                    style="padding-left: {(heading.depth - 2) * 1}rem"
                >
                    <a href="#{heading.id}" class="toc-link">
                        {heading.text}
                    </a>
                </li>
            {/each}
        </ul>
    </div>
</aside>

<style>
    .toc {
        width: var(--toc-width);
        position: sticky;
        top: calc(var(--header-height) + 2rem);
        height: fit-content;
        padding-left: 1.5rem;
        border-left: 1px solid var(--border);
        margin-top: 3rem;
    }

    .toc-title {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--foreground);
    }

    .toc-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .toc-link {
        font-size: 0.875rem;
        color: var(--muted-foreground);
        transition: color 0.1s;
        display: block;
        line-height: 1.25;
    }

    .toc-link:hover {
        color: var(--foreground);
    }

    @media (max-width: 1024px) {
        .toc {
            display: none;
        }
    }
</style>
