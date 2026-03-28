<script lang="ts">
    import { page } from "$app/state";
    import Sidebar from "./Sidebar.svelte";

    interface NavItem {
        name: string;
        slug: string;
        title: string;
        children: NavItem[];
    }

    let { nav, activeSlug = "" } = $props<{
        nav: NavItem[];
        activeSlug?: string;
    }>();

    function isActive(slug: string) {
        const currentSlug = page.params.slug || "index";
        return currentSlug === slug;
    }
</script>

<nav class="sidebar-nav">
    <ul class="nav-list">
        {#each nav as item}
            <li class="nav-item">
                <a
                    href={item.slug === "index" ? "/" : `/${item.slug}`}
                    class="nav-link"
                    class:active={isActive(item.slug)}
                >
                    {item.title}
                </a>
                {#if item.children && item.children.length > 0}
                    <ul class="nav-sublist">
                        <Sidebar nav={item.children} {activeSlug} />
                    </ul>
                {/if}
            </li>
        {/each}
    </ul>
</nav>

<style>
    .sidebar-nav {
        padding: 1.5rem 1rem;
    }

    .nav-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
    }

    .nav-link {
        display: block;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--muted-foreground);
        border-radius: var(--radius);
        transition: all 0.2s;
    }

    .nav-link:hover {
        background-color: var(--accent);
        color: var(--accent-foreground);
    }

    .nav-link.active {
        background-color: hsl(var(--primary-h), var(--primary-s), 95%);
        color: var(--primary);
        font-weight: 600;
    }

    :global(.dark) .nav-link.active {
        background-color: hsl(var(--primary-h), var(--primary-s), 15%);
        color: var(--primary);
    }

    .nav-sublist {
        list-style: none;
        margin-left: 1rem;
        border-left: 1px solid var(--border);
        padding-left: 0.5rem;
    }
</style>
