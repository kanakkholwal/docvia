<script lang="ts">
import { page } from "$app/state";

interface PageMeta {
	slug: string;
	title: string;
	description: string;
}

let { pagesMeta = [] } = $props<{ pagesMeta: PageMeta[] }>();

const currentSlug = $derived(page.params.slug || "index");
const currentIndex = $derived(
	pagesMeta.findIndex((p: PageMeta) => p.slug === currentSlug),
);

const prevPage = $derived(
	currentIndex > 0 ? pagesMeta[currentIndex - 1] : null,
);
const nextPage = $derived(
	currentIndex < pagesMeta.length - 1 ? pagesMeta[currentIndex + 1] : null,
);

function urlFor(slug: string): string {
	return slug === "index" ? "/docs" : `/docs/${slug}`;
}
</script>

<div class="pagination">
    <div class="pagination-prev">
        {#if prevPage}
            <a
                href={urlFor(prevPage.slug)}
                class="page-card prev"
            >
                <span class="label">Previous</span>
                <span class="title">{prevPage.title}</span>
            </a>
        {/if}
    </div>

    <div class="pagination-next">
        {#if nextPage}
            <a
                href={urlFor(nextPage.slug)}
                class="page-card next"
            >
                <span class="label">Next</span>
                <span class="title">{nextPage.title}</span>
            </a>
        {/if}
    </div>
</div>

<style>
    .pagination {
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        margin-top: 4rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
    }

    .pagination-prev,
    .pagination-next {
        flex: 1;
    }

    .page-card {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        transition: all 0.2s;
        background-color: var(--card);
    }

    .page-card:hover {
        border-color: var(--primary);
        background-color: var(--accent);
    }

    .page-card.prev {
        align-items: flex-start;
    }

    .page-card.next {
        align-items: flex-end;
    }

    .label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--muted-foreground);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }

    .title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--primary);
    }
</style>
