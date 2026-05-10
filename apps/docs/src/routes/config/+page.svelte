<script lang="ts">
import PageHeader from "$lib/components/page-header.svelte";
import Prose from "$lib/components/prose.svelte";
</script>

<svelte:head>
	<title>Config reference · docvia</title>
</svelte:head>

<PageHeader
	eyebrow="Configuration"
	title="Config reference"
	description="Every option accepted by defineConfig, with defaults and types."
/>

<Prose>
	<p>
		<code>defineConfig</code> is re-exported from both
		<code>@docvia/cli</code>
		and <code>@docvia/plugins</code>. It fills in defaults and returns a
		fully-resolved <code>docviaConfig</code>.
	</p>

	<pre><code>{`import { defineConfig } from "@docvia/cli";

export default defineConfig({ /* ... */ });`}</code></pre>

	<h2>Top-level options</h2>
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
				<td><code>sourceDir</code></td>
				<td><code>string</code></td>
				<td><code>"docs"</code></td>
				<td>Directory of Markdown source files.</td>
			</tr>
			<tr>
				<td><code>outDir</code></td>
				<td><code>string</code></td>
				<td><code>".docvia"</code></td>
				<td>Where the generated module graph is written.</td>
			</tr>
			<tr>
				<td><code>renderer</code></td>
				<td><code>RendererAdapter</code></td>
				<td>—</td>
				<td>
					Required at build time. Use
					<code>createReactRenderer(...)</code> or
					<code>createSvelteRenderer(...)</code>.
				</td>
			</tr>
			<tr>
				<td><code>plugins</code></td>
				<td><code>docviaPlugin[]</code></td>
				<td><code>[]</code></td>
				<td>Pipeline plugins, sorted by phase then priority.</td>
			</tr>
			<tr>
				<td><code>components</code></td>
				<td><code>Record&lt;string, ComponentConfig&gt;</code></td>
				<td>—</td>
				<td>
					Components referenced by <code>:::name</code> directives.
				</td>
			</tr>
			<tr>
				<td><code>collections</code></td>
				<td><code>CollectionConfig[]</code></td>
				<td>one default <code>"docs"</code> collection</td>
				<td>One or more named source roots.</td>
			</tr>
			<tr>
				<td><code>frontmatter</code></td>
				<td><code>z.ZodObject</code></td>
				<td>—</td>
				<td>Extends the built-in frontmatter schema.</td>
			</tr>
			<tr>
				<td><code>syntax.theme</code></td>
				<td><code>string</code></td>
				<td><code>"github-dark"</code></td>
				<td>Shiki theme name.</td>
			</tr>
			<tr>
				<td><code>syntax.langs</code></td>
				<td><code>string[]</code></td>
				<td>8 common languages</td>
				<td>Languages preloaded into the highlighter.</td>
			</tr>
		</tbody>
	</table>

	<h2>Built-in frontmatter</h2>
	<table>
		<thead>
			<tr>
				<th>Field</th>
				<th>Type</th>
				<th>Default</th>
				<th>Required</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>title</code></td><td><code>string</code></td><td>—</td><td>yes</td>
			</tr>
			<tr>
				<td><code>description</code></td><td><code>string</code></td><td><code>""</code></td><td>no</td>
			</tr>
			<tr>
				<td><code>tags</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>no</td>
			</tr>
			<tr>
				<td><code>draft</code></td><td><code>boolean</code></td><td><code>false</code></td><td>no</td>
			</tr>
			<tr>
				<td><code>order</code></td><td><code>number</code></td><td>—</td><td>no</td>
			</tr>
			<tr>
				<td><code>slug</code></td><td><code>string</code></td><td>derived from path</td><td>no</td>
			</tr>
		</tbody>
	</table>
</Prose>
