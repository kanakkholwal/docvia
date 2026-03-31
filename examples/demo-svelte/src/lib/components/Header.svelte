<script lang="ts">
	let { nav, sidebarOpen = false } = $props<{
		nav: any[];
		sidebarOpen: boolean;
	}>();

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<header class="header">
	<div class="header-container">
		<button
			class="menu-button"
			onclick={toggleSidebar}
			aria-label="Toggle sidebar"
			title="Toggle sidebar"
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
				<line x1="4" y1="6" x2="20" y2="6"></line>
				<line x1="4" y1="12" x2="20" y2="12"></line>
				<line x1="4" y1="18" x2="20" y2="18"></line>
			</svg>
		</button>

		<a href="/" class="logo">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="28"
				height="28"
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
			<span class="logo-text">docvia</span>
		</a>

		<div class="search-container">
			<div class="search-box">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
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
				<input
					type="text"
					placeholder="Search docs..."
					class="search-input"
					readonly
				/>
				<kbd class="search-kbd">⌘K</kbd>
			</div>
		</div>

		<nav class="header-nav">
			<a
				href="https://github.com/kanakkholwal/docvia"
				target="_blank"
				rel="noopener noreferrer"
				class="nav-icon"
				title="GitHub"
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
</header>

<style>
	.header {
		height: var(--header-height);
		border-bottom: 1px solid var(--border);
		background: linear-gradient(
			to bottom,
			var(--background) 0%,
			var(--background) 95%,
			transparent 100%
		);
		backdrop-filter: blur(8px);
		position: sticky;
		top: 0;
		z-index: 50;
		width: 100%;
	}

	.header-container {
		max-width: 1600px;
		margin: 0 auto;
		height: 100%;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		gap: 1rem;
	}

	.menu-button {
		display: none;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: transparent;
		color: var(--foreground);
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.menu-button:hover {
		background-color: var(--accent);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--foreground);
		font-weight: 700;
		font-size: 1.125rem;
		transition: opacity 0.2s;
		flex-shrink: 0;
		text-decoration: none;
	}

	.logo:hover {
		opacity: 0.8;
	}

	.logo-icon {
		color: var(--primary);
		width: 28px;
		height: 28px;
	}

	.logo-text {
		letter-spacing: -0.5px;
	}

	.search-container {
		flex: 1;
		max-width: 24rem;
		display: flex;
		justify-content: center;
	}

	.search-box {
		width: 100%;
		height: 2.25rem;
		background-color: var(--muted);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		padding: 0 0.75rem;
		gap: 0.5rem;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.search-box:hover {
		border-color: var(--muted-foreground);
		background-color: var(--accent);
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--foreground);
		outline: none;
		font-size: 0.875rem;
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--muted-foreground);
	}

	.search-kbd {
		margin-left: auto;
		background: var(--background);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.7rem;
		border: 1px solid var(--border);
		font-family: monospace;
		flex-shrink: 0;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.nav-icon {
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted-foreground);
		border-radius: 0.5rem;
		transition: all 0.2s;
		border: 1px solid transparent;
	}

	.nav-icon:hover {
		color: var(--foreground);
		background-color: var(--accent);
	}

	@media (max-width: 768px) {
		.menu-button {
			display: flex;
		}

		.search-container {
			display: none;
		}

		.header-container {
			padding: 0 0.5rem;
		}
	}

	@media (max-width: 640px) {
		.logo-text {
			display: none;
		}

		.header-nav {
			gap: 0;
		}
	}
</style>
