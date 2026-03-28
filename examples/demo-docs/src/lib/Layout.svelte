<script lang="ts">
</script>

<div class="dockit-layout">
    <header class="dockit-header">
        <div class="dockit-logo">
            <a href="/">Dockit Demo</a>
        </div>
    </header>

    <div class="dockit-container">
        <aside class="dockit-sidebar">
            <nav>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/components">Components</a></li>
                </ul>
            </nav>
        </aside>

        <main class="dockit-main">
            <slot />
        </main>
    </div>
</div>

<style>
    .dockit-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .dockit-header {
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 2rem;
        background-color: #0f172a;
        border-bottom: 1px solid #1e293b;
        position: sticky;
        top: 0;
        z-index: 50;
    }

    .dockit-logo a {
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        text-decoration: none;
    }

    .dockit-container {
        display: flex;
        flex: 1;
    }

    .dockit-sidebar {
        width: 280px;
        border-right: 1px solid #1e293b;
        padding: 2rem;
        position: sticky;
        top: 64px;
        height: calc(100vh - 64px);
    }

    .dockit-sidebar ul {
        list-style: none;
        padding: 0;
    }

    .dockit-sidebar a {
        display: block;
        padding: 0.5rem 0;
        color: #94a3b8;
        text-decoration: none;
        transition: color 0.2s;
    }

    .dockit-sidebar a:hover {
        color: white;
    }

    .dockit-main {
        flex: 1;
        padding: 2rem 4rem;
        max-width: 800px;
        margin: 0 auto;
    }
</style>
