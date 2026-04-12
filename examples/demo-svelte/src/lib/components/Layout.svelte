<script lang="ts">
import type { Snippet } from "svelte";
import Sidebar from "./Sidebar.svelte";
import TableOfContents from "./TableOfContents.svelte";

interface Props {
	tree: any;
	children: Snippet;
}

let { tree, children }: Props = $props();
let theme = $state("dark");
let sidebarOpen = $state(false);

function toggleTheme() {
	theme = theme === "dark" ? "light" : "dark";
	document.documentElement.setAttribute("data-theme", theme);
	localStorage.setItem("docvia-theme", theme);
}

function closeSidebar() {
	sidebarOpen = false;
}

$effect(() => {
	const saved = localStorage.getItem("docvia-theme");
	if (saved) {
		theme = saved;
		document.documentElement.setAttribute("data-theme", saved);
	}
});
</script>

<div class="layout-root">
  <header class="docs-header">
    <div class="docs-header-inner">
      <div class="docs-header-left">
        <button class="mobile-menu-btn" onclick={() => sidebarOpen = !sidebarOpen} aria-label="Toggle sidebar">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
        </button>
        <a href="/" class="docs-logo">
          docvia<span>docs</span>
        </a>
      </div>
      <div class="docs-header-right">
        <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
          {#if theme === "dark"}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
          {/if}
        </button>
      </div>
    </div>
  </header>

  <div class="docs-body">
    {#if sidebarOpen}
      <div class="sidebar-overlay" role="button" tabindex="0" onclick={closeSidebar} onkeydown={(e) => { if (e.key === "Escape") closeSidebar(); }} aria-label="Close sidebar"></div>
    {/if}

    <aside class="sidebar" class:sidebar--open={sidebarOpen}>
      <nav aria-label="Documentation">
        <Sidebar nav={tree?.children ?? []} />
      </nav>
    </aside>

    <main class="docs-main">
      <div class="doc-page">
        <article class="doc-content">
          <div class="prose">
            {@render children()}
          </div>
        </article>

        <aside class="toc">
          <TableOfContents />
        </aside>
      </div>
    </main>
  </div>
</div>

<style>
  .layout-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .docs-header {
    position: sticky;
    top: 0;
    z-index: 50;
    height: var(--header-h);
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 80%, transparent);
    backdrop-filter: blur(12px);
  }

  .docs-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 24px;
  }

  .docs-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .docs-logo {
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.02em;
    color: var(--fg);
    text-decoration: none;
  }

  .docs-logo span {
    color: var(--muted);
    font-weight: 400;
    margin-left: 8px;
    font-size: 13px;
  }

  .docs-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition: color var(--transition), border-color var(--transition);
  }

  .theme-toggle:hover {
    color: var(--fg);
    border-color: var(--fg);
  }

  .theme-toggle ::global(svg) {
    width: 16px;
    height: 16px;
  }

  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: var(--muted);
    cursor: pointer;
  }

  .mobile-menu-btn ::global(svg) {
    width: 20px;
    height: 20px;
  }

  .docs-body {
    display: flex;
    flex: 1;
  }

  .sidebar {
    position: sticky;
    top: var(--header-h);
    width: var(--sidebar-w);
    height: calc(100vh - var(--header-h));
    overflow-y: auto;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    padding: 16px 12px;
  }

  .docs-main {
    flex: 1;
    min-width: 0;
    padding: 32px 40px;
  }

  .doc-page {
    display: flex;
    gap: 40px;
    max-width: calc(var(--content-max) + var(--toc-w) + 40px);
    margin: 0 auto;
  }

  .doc-content {
    flex: 1;
    min-width: 0;
    max-width: var(--content-max);
  }

  .toc {
    display: none;
    width: var(--toc-w);
    flex-shrink: 0;
    position: sticky;
    top: calc(var(--header-h) + 32px);
    max-height: calc(100vh - var(--header-h) - 64px);
    overflow-y: auto;
    align-self: flex-start;
  }

  .sidebar-overlay {
    display: none;
  }

  @media (min-width: 1280px) {
    .toc {
      display: block;
    }
  }

  @media (max-width: 1024px) {
    .sidebar {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .sidebar--open {
      display: block;
      position: fixed;
      top: var(--header-h);
      left: 0;
      z-index: 40;
      background: var(--bg);
      width: 280px;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }

    .sidebar-overlay {
      display: block;
      position: fixed;
      inset: 0;
      top: var(--header-h);
      z-index: 39;
      background: rgba(0, 0, 0, 0.5);
    }
  }

  @media (max-width: 640px) {
    .docs-main {
      padding: 24px 16px;
    }

    .doc-page {
      flex-direction: column;
    }
  }
</style>
