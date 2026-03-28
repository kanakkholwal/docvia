<script lang="ts">
    let { nav } = $props<{ nav: any[] }>();

    // A simple icon library can be added later, for now we use SVG
</script>

<header class="header">
    <div class="header-container">
        <div class="header-left">
            <a href="/" class="logo">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="logo-icon"
                >
                    <path
                        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    ></path>
                    <polyline points="3.29 7 12 12 20.71 7"></polyline>
                    <line x1="12" y1="22" x2="12" y2="12"></line>
                </svg>
                <span class="logo-text">Dockit</span>
            </a>
        </div>

        <div class="header-center">
            <div class="search-placeholder">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Search documentation...</span>
                <kbd>⌘K</kbd>
            </div>
        </div>

        <div class="header-right">
            <nav class="top-nav">
                <a href="/" class="nav-link">Guide</a>
                <a href="/components" class="nav-link">Components</a>
                <a
                    href="https://github.com/kanakkholwal/dockit"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-link"
                    title=""
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                        ></path>
                    </svg>
                </a>
            </nav>
        </div>
    </div>
</header>

<style>
    .header {
        height: var(--header-height);
        border-bottom: 1px solid var(--border);
        background-color: hsla(210, 40%, 98%, 0.8);
        backdrop-filter: blur(12px);
        position: sticky;
        top: 0;
        z-index: 50;
        width: 100%;
    }

    :global(.dark) .header {
        background-color: hsla(222, 47%, 6%, 0.8);
    }

    .header-container {
        max-width: 1440px;
        margin: 0 auto;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem;
    }

    .header-left {
        display: flex;
        align-items: center;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--foreground);
        font-weight: 700;
        font-size: 1.25rem;
        transition: opacity 0.2s;
    }

    .logo:hover {
        opacity: 0.8;
    }

    .logo-icon {
        color: var(--primary);
    }

    .header-center {
        flex: 1;
        display: flex;
        justify-content: center;
        max-width: 32rem;
        margin: 0 2rem;
    }

    .search-placeholder {
        width: 100%;
        height: 2.25rem;
        background-color: var(--muted);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        gap: 0.5rem;
        color: var(--muted-foreground);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .search-placeholder:hover {
        border-color: var(--muted-foreground);
    }

    .search-placeholder kbd {
        margin-left: auto;
        background: var(--background);
        padding: 0.1rem 0.3rem;
        border-radius: 0.2rem;
        font-size: 0.7rem;
        border: 1px solid var(--border);
    }

    .header-right {
        display: flex;
        align-items: center;
    }

    .top-nav {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .nav-link {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--muted-foreground);
        transition: color 0.2s;
    }

    .nav-link:hover {
        color: var(--foreground);
    }

    .github-link {
        color: var(--muted-foreground);
        transition: color 0.2s;
    }

    .github-link:hover {
        color: var(--foreground);
    }

    @media (max-width: 768px) {
        .header-center {
            display: none;
        }
    }
</style>
