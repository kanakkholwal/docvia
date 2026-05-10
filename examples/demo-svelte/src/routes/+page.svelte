<script lang="ts">
const features = [
	{
		title: "SvelteKit",
		body: "Pages live under src/routes/[...slug] as a single rest route.",
	},
	{
		title: "Svelte 5 (runes)",
		body: "Components use $state and $derived; renderer ships zero markdown to the client.",
	},
	{
		title: "Vite-native",
		body: "Markdown is consumed via the @docvia/plugin-vite ?docvia transform.",
	},
	{
		title: "SSR + hydration",
		body: "Server renders the tree; only declared islands hydrate on the client.",
	},
];

const codeSnippet = `// docvia.config.ts
import { defineConfig } from "@docvia/cli";
import {
  createShikiHighlighter,
  createSvelteRenderer,
} from "@docvia/renderer-svelte/node";

export default defineConfig({
  sourceDir: "src/docs",
  outDir: ".docvia",
  renderer: createSvelteRenderer({
    highlighter: createShikiHighlighter({
      theme: "dracula",
      langs: ["typescript", "svelte", "bash"],
    }),
  }),
});`;
</script>

<div class="sk-shell">
	<header class="sk-topbar">
		<div class="sk-topbar-inner">
			<div class="sk-brand">
				<span class="sk-brand-mark" aria-hidden="true">
					<svg viewBox="0 0 32 32" width="20" height="20">
						<path
							fill="currentColor"
							d="M28.7 8.7C25.5 4.1 19.1 2.7 14.5 5.7l-8 5.1A9.2 9.2 0 0 0 2.4 17a9.7 9.7 0 0 0 1 6.2 9.2 9.2 0 0 0-1.4 3.4 9.8 9.8 0 0 0 1.7 7.4c3.2 4.6 9.6 6 14.2 3l8-5.1a9.2 9.2 0 0 0 4.1-6.2 9.7 9.7 0 0 0-1-6.2 9.2 9.2 0 0 0 1.4-3.4 9.8 9.8 0 0 0-1.7-7.4Z"
						/>
					</svg>
				</span>
				<span class="sk-brand-name">docvia</span>
				<span class="sk-brand-sep">/</span>
				<span class="sk-brand-demo">sveltekit demo</span>
			</div>
			<nav class="sk-topbar-nav">
				<a href="/docs">Docs</a>
				<a
					href="https://github.com/kanakkholwal/docvia"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</nav>
		</div>
	</header>

	<main class="sk-main">
		<section class="sk-hero">
			<div class="sk-eyebrow">
				<span class="sk-eyebrow-dot" aria-hidden="true"></span>
				SvelteKit · Svelte 5 · Vite
			</div>
			<h1 class="sk-hero-title">
				docvia, running inside <span class="sk-accent">SvelteKit</span>.
			</h1>
			<p class="sk-hero-lede">
				This demo shows the Svelte renderer wired into a SvelteKit project
				with the Vite integration. The same Markdown source can be rendered
				by any supported framework — open the Next.js demo to compare.
			</p>
			<div class="sk-cta-row">
				<a href="/docs" class="sk-btn sk-btn-primary">
					Open the docs →
				</a>
				<a
					href="https://github.com/kanakkholwal/docvia/tree/main/examples/demo-svelte"
					class="sk-btn sk-btn-ghost"
					target="_blank"
					rel="noreferrer"
				>
					Source on GitHub
				</a>
			</div>
		</section>

		<section class="sk-feature-grid">
			{#each features as f}
				<div class="sk-feature">
					<div class="sk-feature-title">{f.title}</div>
					<p class="sk-feature-body">{f.body}</p>
				</div>
			{/each}
		</section>

		<section class="sk-code-section">
			<div class="sk-code-meta">
				<span class="sk-code-meta-dot" aria-hidden="true"></span>
				<span class="sk-code-meta-label">docvia.config.ts</span>
			</div>
			<pre class="sk-code"><code>{codeSnippet}</code></pre>
		</section>

		<section class="sk-footnote">
			<div>
				<strong>Same compiler, different renderer.</strong> The Markdown in
				<code>src/docs/</code> mirrors the Next.js demo. Only the renderer
				adapter and framework chrome differ.
			</div>
			<a href="/docs" class="sk-footnote-link">
				Read the guide →
			</a>
		</section>
	</main>

	<footer class="sk-footer">
		<span>Powered by docvia · SvelteKit</span>
		<span class="sk-footer-mono">src/routes/+page.svelte</span>
	</footer>
</div>

<style>
	.sk-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background:
			radial-gradient(
				1200px 600px at 50% -10%,
				rgba(255, 62, 0, 0.18),
				transparent 60%
			),
			radial-gradient(
				900px 500px at 90% 10%,
				rgba(255, 138, 88, 0.08),
				transparent 60%
			),
			var(--bg);
	}

	/* Topbar */
	.sk-topbar {
		position: sticky;
		top: 0;
		z-index: 40;
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--bg) 80%, transparent);
		backdrop-filter: blur(12px);
	}
	.sk-topbar-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sk-brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		letter-spacing: -0.01em;
	}
	.sk-brand-mark {
		display: inline-grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 7px;
		background: #ff3e00;
		color: #fff;
	}
	.sk-brand-name {
		font-weight: 600;
		color: var(--fg);
	}
	.sk-brand-sep {
		color: var(--border);
	}
	.sk-brand-demo {
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 12px;
	}
	.sk-topbar-nav {
		display: inline-flex;
		gap: 4px;
		font-size: 13px;
	}
	.sk-topbar-nav a {
		padding: 6px 12px;
		border-radius: 6px;
		color: var(--muted);
		text-decoration: none;
		transition:
			color 150ms ease,
			background 150ms ease;
	}
	.sk-topbar-nav a:hover {
		color: var(--fg);
		background: var(--surface);
	}

	/* Main */
	.sk-main {
		flex: 1;
		max-width: 1024px;
		width: 100%;
		margin: 0 auto;
		padding: 80px 24px 56px;
	}

	/* Hero */
	.sk-hero {
		max-width: 720px;
		margin: 0 auto;
		text-align: center;
	}
	.sk-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 12px;
		border: 1px solid color-mix(in srgb, #ff3e00 35%, var(--border));
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted);
		background: color-mix(in srgb, var(--bg-subtle) 80%, transparent);
	}
	.sk-eyebrow-dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: #ff3e00;
		box-shadow: 0 0 12px rgba(255, 62, 0, 0.6);
	}
	.sk-hero-title {
		margin-top: 24px;
		font-size: clamp(36px, 5.5vw, 56px);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 1.05;
		color: var(--fg);
	}
	.sk-accent {
		background: linear-gradient(180deg, #ff7a3a 0%, #ff3e00 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.sk-hero-lede {
		margin-top: 18px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--muted);
	}
	.sk-cta-row {
		margin-top: 28px;
		display: inline-flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.sk-btn {
		display: inline-flex;
		align-items: center;
		height: 40px;
		padding: 0 18px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			color 150ms ease,
			transform 150ms ease;
	}
	.sk-btn:hover {
		transform: translateY(-1px);
	}
	.sk-btn-primary {
		background: #ff3e00;
		color: #fff;
		border: 1px solid #ff3e00;
	}
	.sk-btn-primary:hover {
		background: #ff5722;
	}
	.sk-btn-ghost {
		border: 1px solid var(--border);
		color: var(--fg);
	}
	.sk-btn-ghost:hover {
		border-color: #ff3e00;
		color: #ff7a3a;
	}

	/* Feature grid */
	.sk-feature-grid {
		margin-top: 80px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	@media (min-width: 768px) {
		.sk-feature-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	.sk-feature {
		padding: 20px;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 14px;
		transition:
			border-color 150ms ease,
			transform 150ms ease;
	}
	.sk-feature:hover {
		border-color: color-mix(in srgb, #ff3e00 50%, var(--border));
		transform: translateY(-2px);
	}
	.sk-feature-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--fg);
		margin-bottom: 6px;
	}
	.sk-feature-body {
		font-size: 13px;
		line-height: 1.55;
		color: var(--muted);
		margin: 0;
	}

	/* Code section */
	.sk-code-section {
		margin-top: 64px;
		border: 1px solid var(--border);
		border-radius: 14px;
		background: var(--bg-subtle);
		overflow: hidden;
	}
	.sk-code-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted);
	}
	.sk-code-meta-dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: #ff3e00;
	}
	.sk-code {
		margin: 0;
		padding: 20px;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.65;
		color: var(--fg);
		overflow-x: auto;
	}

	/* Footnote */
	.sk-footnote {
		margin-top: 64px;
		padding: 20px 24px;
		border: 1px dashed var(--border);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
		color: var(--muted);
		font-size: 14px;
		line-height: 1.55;
	}
	.sk-footnote strong {
		color: var(--fg);
	}
	.sk-footnote code {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 2px 6px;
		background: var(--surface);
		border-radius: 4px;
	}
	.sk-footnote-link {
		color: #ff7a3a;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
	}
	.sk-footnote-link:hover {
		color: #ff3e00;
	}

	/* Footer */
	.sk-footer {
		border-top: 1px solid var(--border);
		padding: 20px 24px;
		font-size: 12px;
		color: var(--muted-fg);
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
	}
	.sk-footer-mono {
		font-family: var(--font-mono);
	}
</style>
