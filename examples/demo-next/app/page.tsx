import Link from "next/link";
import "./home.css";

export const metadata = {
	title: "Next.js demo · docvia",
	description:
		"A demo of docvia running inside Next.js (App Router) with React 19 and the createReactRenderer adapter.",
};

const features = [
	{
		title: "App Router",
		body: "Pages live under app/docs/[[...slug]]/ as a single dynamic route.",
	},
	{
		title: "Server Components",
		body: "docvia.source.docs.get(slug) runs on the server; only hydrated islands ship.",
	},
	{
		title: "React 19",
		body: "Renders with @docvia/renderer-react, using createShikiHighlighter for code.",
	},
	{
		title: "Static export",
		body: "generateStaticParams() prerenders every page at build time.",
	},
];

const codeSnippet = `// docvia.config.ts
import { defineConfig } from "@docvia/cli";
import {
  createReactRenderer,
  createShikiHighlighter,
} from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer({
    highlighter: createShikiHighlighter({
      theme: "github-dark",
      langs: ["typescript", "tsx", "bash"],
    }),
  }),
});`;

export default function Home() {
	return (
		<div className="nx-shell">
			<header className="nx-topbar">
				<div className="nx-topbar-inner">
					<div className="nx-brand">
						<span className="nx-brand-mark" aria-hidden="true">
							▲
						</span>
						<span className="nx-brand-name">docvia</span>
						<span className="nx-brand-sep">/</span>
						<span className="nx-brand-demo">next.js demo</span>
					</div>
					<nav className="nx-topbar-nav">
						<Link href="/docs">Docs</Link>
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

			<main className="nx-main">
				<section className="nx-hero">
					<div className="nx-eyebrow">
						<span className="nx-eyebrow-dot" aria-hidden="true"></span>
						Next.js · App Router · React 19
					</div>
					<h1 className="nx-hero-title">
						docvia, running inside <span className="nx-accent">Next.js</span>.
					</h1>
					<p className="nx-hero-lede">
						This demo shows the React renderer wired into a Next.js App
						Router project. The same Markdown source can be rendered by any
						supported framework — open the SvelteKit demo to compare.
					</p>
					<div className="nx-cta-row">
						<Link href="/docs" className="nx-btn nx-btn-primary">
							Open the docs →
						</Link>
						<a
							href="https://github.com/kanakkholwal/docvia/tree/main/examples/demo-next"
							className="nx-btn nx-btn-ghost"
							target="_blank"
							rel="noreferrer"
						>
							Source on GitHub
						</a>
					</div>
				</section>

				<section className="nx-feature-grid">
					{features.map((f) => (
						<div className="nx-feature" key={f.title}>
							<div className="nx-feature-title">{f.title}</div>
							<p className="nx-feature-body">{f.body}</p>
						</div>
					))}
				</section>

				<section className="nx-code-section">
					<div className="nx-code-meta">
						<span className="nx-code-meta-dot" aria-hidden="true"></span>
						<span className="nx-code-meta-label">docvia.config.ts</span>
					</div>
					<pre className="nx-code">
						<code>{codeSnippet}</code>
					</pre>
				</section>

				<section className="nx-footnote">
					<div>
						<strong>Same compiler, different renderer.</strong> The Markdown
						in <code>docs/</code> is identical to the SvelteKit demo. Only the
						renderer adapter and framework chrome differ.
					</div>
					<Link href="/docs/getting-started" className="nx-footnote-link">
						Read the guide →
					</Link>
				</section>
			</main>

			<footer className="nx-footer">
				<span>Powered by docvia · Next.js {/* version label */}</span>
				<span className="nx-footer-mono">app/page.tsx</span>
			</footer>
		</div>
	);
}
