<script lang="ts">
  import type { Snippet } from "svelte";
  import Header from "./Header.svelte";
  import Sidebar from "./Sidebar.svelte";
  import TableOfContents from "./TableOfContents.svelte";

  type NavItem = {
    name: string;
    slug: string;
    title: string;
    children: NavItem[];
  };
  interface Props {
    nav: NavItem[];
    children: Snippet;
  }

  let { nav, children }: Props = $props();
  let sidebarOpen = $state(false);
  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<div class="layout-root">
  <Header {nav} sidebarOpen={sidebarOpen} />

  <div class="layout-container">
    {#if sidebarOpen}
      <div
        class="sidebar-overlay"
        role="button"
        tabindex="0"
        onclick={closeSidebar}
        onkeydown={(e) => {
          if (e.key === "Escape") closeSidebar();
        }}
        aria-label="Close sidebar"
      ></div>
    {/if}

    <aside class={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <nav class="sidebar-content">
        <Sidebar {nav} />
      </nav>
    </aside>

    <main class="main-content">
      <article class="article-wrapper">
        <div class="article-inner prose prose-invert">
          {@render children()}
        </div>
      </article>
    </main>

    <aside class="toc-sidebar">
      <TableOfContents />
    </aside>
  </div>
</div>

<style>
  :global {
    body {
      margin: 0;
      padding: 0;
    }
  }

  .layout-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--background);
    color: var(--foreground);
  }

  .layout-container {
    display: flex;
    flex: 1;
    position: relative;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }

  .sidebar {
    width: var(--sidebar-width);
    border-right: 1px solid var(--border);
    position: fixed;
    height: calc(100vh - var(--header-height));
    top: var(--header-height);
    left: 0;
    overflow-y: auto;
    flex-shrink: 0;
    z-index: 40;
  }

  .sidebar-content {
    padding: 1.5rem 0;
  }

  .main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    margin-right: var(--toc-width);
    min-width: 0;
  }

  .article-wrapper {
    padding: 2rem 3rem;
  }

  .article-inner {
    max-width: 65ch;
    margin: 0 auto;
  }

  .toc-sidebar {
    width: var(--toc-width);
    position: fixed;
    right: 0;
    top: var(--header-height);
    height: calc(100vh - var(--header-height));
    border-left: 1px solid var(--border);
    overflow-y: auto;
    flex-shrink: 0;
    padding: 2rem 1.5rem;
    font-size: 0.875rem;
  }

  .sidebar-overlay {
    display: none;
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 39;
  }

  /* Mobile/Tablet */
  @media (max-width: 1200px) {
    .toc-sidebar {
      display: none;
    }

    .main-content {
      margin-right: 0;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: var(--header-height);
      width: 280px;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sidebar-overlay {
      display: block;
    }

    .sidebar-overlay.show {
      display: block;
    }

    .main-content {
      margin-left: 0;
    }

    .article-wrapper {
      padding: 1.5rem;
    }

    .toc-sidebar {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .article-wrapper {
      padding: 1rem;
    }

    .article-inner {
      max-width: 100%;
    }
  }
</style>
