<script lang="ts">
  import { page } from "$app/state";

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Components", href: "/components" },
  ];

  let currentPath = $derived(page.url.pathname);
</script>

<div class="layout">
  <header class="header">
    <nav class="navbar">
      <div class="nav-content">
        <a href="/" class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">Dockit</span>
        </a>

        <div class="nav-links">
          {#each navItems as item}
            <a
              href={item.href}
              class="nav-link"
              class:active={currentPath === item.href}
            >
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>
  </header>

  <div class="main-container">
    <aside class="sidebar">
      <div class="sidebar-content">
        <div class="sidebar-section">
          <h3 class="sidebar-title">Documentation</h3>
          <ul class="sidebar-nav">
            {#each navItems as item}
              <li>
                <a
                  href={item.href}
                  class="sidebar-link"
                  class:active={currentPath === item.href}
                >
                  {item.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </aside>

    <main class="content">
      <div class="content-wrapper">
        <slot />
      </div>
    </main>
  </div>
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 40;
    background: hsl(var(--background));
    border-bottom: 1px solid hsl(var(--border));
    backdrop-filter: blur(8px);
    background-color: hsla(var(--background), 0.95);
  }

  .navbar {
    height: 64px;
    display: flex;
    align-items: center;
  }

  .nav-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    cursor: pointer;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: hsl(var(--foreground));
  }

  .nav-links {
    display: flex;
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    color: hsl(var(--muted-foreground));
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    transition: color var(--transition-fast);
    border-radius: var(--radius);
  }

  .nav-link:hover {
    color: hsl(var(--foreground));
  }

  .nav-link.active {
    color: hsl(var(--accent));
  }

  .main-container {
    display: flex;
    flex: 1;
  }

  .sidebar {
    width: 280px;
    border-right: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    position: sticky;
    top: 64px;
    height: calc(100vh - 64px);
    overflow-y: auto;
  }

  .sidebar-content {
    padding: 2rem 1.5rem;
  }

  .sidebar-section {
    margin-bottom: 2rem;
  }

  .sidebar-title {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--muted-foreground));
    margin-bottom: 1rem;
  }

  .sidebar-nav {
    list-style: none;
  }

  .sidebar-link {
    display: block;
    padding: 0.75rem 0.75rem;
    color: hsl(var(--muted-foreground));
    text-decoration: none;
    font-size: 0.95rem;
    border-radius: var(--radius);
    transition: all var(--transition-fast);
  }

  .sidebar-link:hover {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
  }

  .sidebar-link.active {
    background: hsl(var(--accent) / 0.1);
    color: hsl(var(--accent));
    font-weight: 600;
  }

  .content {
    flex: 1;
    overflow-y: auto;
  }

  .content-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 2rem;
    width: 100%;
  }

  @media (max-width: 768px) {
    .sidebar {
      display: none;
    }

    .content-wrapper {
      padding: 2rem 1.5rem;
    }

    .nav-content {
      padding: 0 1rem;
    }

    .nav-links {
      gap: 0.25rem;
    }

    .nav-link {
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
    }
  }
</style>
