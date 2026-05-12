<script lang="ts">
import PageHeader from "$lib/components/page-header.svelte";
import Prose from "$lib/components/prose.svelte";
</script>

<svelte:head>
	<title>OpenAPI plugin · docvia</title>
	<meta
		name="description"
		content="Render OpenAPI 3.x endpoints inline in your docvia Markdown. Fenced openapi blocks compile into typed endpoint cards at build time."
	/>
</svelte:head>

<PageHeader
	eyebrow="Plugins"
	title="OpenAPI plugin"
	description="Render OpenAPI 3.x endpoints inline in your Markdown. Each fenced openapi block compiles into a typed endpoint card at build time."
/>

<Prose>
	<p>
		Point <code>@docvia/plugin-openapi</code> at a spec file, then drop fenced
		<code>openapi</code> blocks anywhere in your Markdown. Each block is
		replaced — at build time — with a structured endpoint card: heading,
		summary, parameters table, request and response samples. The browser
		never parses a spec at runtime.
	</p>

	<h2>Install</h2>
	<pre><code>{`pnpm add -D @docvia/plugin-openapi`}</code></pre>

	<h2>Configure</h2>
	<p>
		Add it to your <code>docvia.config.ts</code> plugins array. The
		<code>spec</code> path is resolved relative to the current working
		directory.
	</p>
	<pre><code>{`import { defineConfig } from "@docvia/cli";
import { openapi } from "@docvia/plugin-openapi";
import { createReactRenderer } from "@docvia/renderer-react";

export default defineConfig({
  sourceDir: "docs",
  outDir: ".docvia",
  renderer: createReactRenderer(),
  plugins: [
    openapi({ spec: "./openapi.yaml" }),
  ],
});`}</code></pre>

	<h2>Use</h2>
	<p>
		In any Markdown file, write a fenced <code>openapi</code> block with the
		HTTP method and path as the meta string:
	</p>
	<pre><code>{`## List pets

\`\`\`openapi GET /pets
\`\`\`

## Create a pet

\`\`\`openapi POST /pets
\`\`\``}</code></pre>
</Prose>

<!-- ── Rendered output preview ────────────────────────────────────── -->
<section class="my-12">
	<div
		class="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-brand-coral"></span>
		Rendered output
	</div>
	<div class="rounded-xl border border-hairline bg-surface-soft p-6 md:p-8">
		<div
			class="rounded-lg border border-hairline bg-canvas p-6 md:p-8"
		>
			<!-- Heading -->
			<h3
				class="font-display text-2xl text-ink"
				style="letter-spacing: -0.025em;"
			>
				<span
					class="mr-2 inline-flex items-center rounded-md bg-brand-teal px-2 py-0.5 font-mono text-[12px] font-bold uppercase text-card-on-dark"
				>
					GET
				</span>
				<code
					class="rounded-sm bg-surface-card px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
				>
					/pets
				</code>
			</h3>

			<p class="mt-4 font-semibold text-body-strong">List all pets</p>
			<p class="mt-2 text-body">Returns every pet in the registry.</p>

			<!-- Parameters -->
			<h4
				class="mt-8 font-display text-lg text-ink"
				style="letter-spacing: -0.02em;"
			>
				Parameters
			</h4>
			<div class="mt-3 overflow-hidden rounded-md border border-hairline">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-hairline bg-surface-card/60 text-left">
							<th class="px-3 py-2 font-semibold text-ink">Name</th>
							<th class="px-3 py-2 font-semibold text-ink">In</th>
							<th class="px-3 py-2 font-semibold text-ink">Type</th>
							<th class="px-3 py-2 font-semibold text-ink">Required</th>
							<th class="px-3 py-2 font-semibold text-ink">Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="px-3 py-2">
								<code
									class="rounded-sm bg-surface-card px-1.5 py-0.5 font-mono text-[0.9em] text-ink"
								>limit</code>
							</td>
							<td class="px-3 py-2 text-body">query</td>
							<td class="px-3 py-2">
								<code
									class="rounded-sm bg-surface-card px-1.5 py-0.5 font-mono text-[0.9em] text-ink"
								>integer&lt;int32&gt;</code>
							</td>
							<td class="px-3 py-2 text-body">no</td>
							<td class="px-3 py-2 text-body">Maximum number to return.</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Responses -->
			<h4
				class="mt-8 font-display text-lg text-ink"
				style="letter-spacing: -0.02em;"
			>
				Responses
			</h4>
			<p class="mt-3 text-body">
				<span
					class="mr-2 inline-flex items-center rounded-md bg-success/15 px-2 py-0.5 font-mono text-[12px] font-bold text-success"
				>
					200
				</span>
				An array of pets.
			</p>
			<p class="mt-3 font-mono text-[12px] text-muted">application/json</p>
			<pre
				class="mt-2 overflow-x-auto rounded-md border border-hairline bg-surface-card p-4 font-mono text-[13px] leading-relaxed text-ink"
			><code>{`[
  {
    "id": 0,
    "name": "string",
    "tag": "string"
  }
]`}</code></pre>
		</div>

		<p
			class="mt-4 text-center text-[12px] text-muted"
		>
			This is what the plugin emits when it sees
			<code
				class="rounded-sm bg-surface-card px-1.5 py-0.5 font-mono text-[0.9em] text-ink"
			>```openapi GET /pets</code>
			in your Markdown.
		</p>
	</div>
</section>

<Prose>
	<h2>Options</h2>
	<table>
		<thead>
			<tr>
				<th>Option</th>
				<th>Type</th>
				<th>Default</th>
				<th>Description</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>spec</code></td>
				<td><code>string</code></td>
				<td>—</td>
				<td>
					Path to the OpenAPI 3.x spec. JSON, YAML, or YML. Required.
				</td>
			</tr>
			<tr>
				<td><code>fenceLang</code></td>
				<td><code>string</code></td>
				<td><code>"openapi"</code></td>
				<td>
					Language tag the plugin matches. Use <code>"api"</code> to
					look for <code>```api GET /users</code> instead.
				</td>
			</tr>
			<tr>
				<td><code>onMissing</code></td>
				<td><code>"throw" | "warn"</code></td>
				<td><code>"throw"</code></td>
				<td>
					Behaviour when a block references a path or method that
					isn't in the spec.
				</td>
			</tr>
		</tbody>
	</table>

	<h2>How it works</h2>
	<p>
		The plugin hooks <code>afterParse</code>. For each Markdown file, it
		walks the mdast tree, finds matching fenced blocks, and replaces them
		with structured mdast (heading + paragraph + table + code blocks). The
		rest of docvia's pipeline turns those nodes into IR, framework-native
		modules, and your renderer's output — exactly the same path as any
		hand-written Markdown.
	</p>
	<p>
		The spec is hashed and contributes to the plugin's <code>cacheKey</code>,
		so when you change the spec, all pages that reference it are rebuilt.
		Unchanged builds skip the work entirely.
	</p>

	<h2>What's rendered</h2>
	<ul>
		<li>Method and path heading</li>
		<li>Summary and description (when present in the spec)</li>
		<li>Deprecated callout for operations marked <code>deprecated: true</code></li>
		<li>
			Parameters table — name, location (query/path/header/cookie),
			resolved type, required, description
		</li>
		<li>Request body — one code sample per media type</li>
		<li>Responses — grouped by status code, with sample payloads</li>
	</ul>

	<h2>Schema example synthesis</h2>
	<p>
		When a media type lacks an explicit <code>example</code> or
		<code>examples</code>, the plugin synthesizes one from the schema
		shape: <code>string</code> → <code>"string"</code>, <code>integer</code>
		→ <code>0</code>, <code>boolean</code> → <code>true</code>,
		<code>date-time</code> formats use the current ISO timestamp, UUID
		formats use the all-zero UUID. Arrays and objects recurse. Internal
		<code>$ref</code>s under <code>#/components/schemas</code> are
		resolved automatically; external <code>$ref</code>s fall back to the
		ref name.
	</p>

	<h2>Caveats</h2>
	<ul>
		<li>
			External and cross-file <code>$ref</code>s aren't dereferenced —
			displayed as the ref name only.
		</li>
		<li>
			Security schemes, server lists, and response headers aren't
			surfaced yet.
		</li>
		<li>
			This plugin runs inside docvia's compile pipeline. It can't be
			used standalone in a SvelteKit or Next.js app that doesn't compile
			Markdown through docvia.
		</li>
	</ul>
</Prose>
