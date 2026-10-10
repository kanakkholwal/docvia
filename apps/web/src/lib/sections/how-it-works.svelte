<script lang="ts">
import BentoCard from "#lib/components/site/bento-card.svelte";
import Section from "#lib/components/site/section.svelte";
import CodeSample from "#lib/components/code-sample.svelte";
import EditDemo from "#lib/components/site/edit-demo.svelte";

// Each line maps to code: build/src/fs.ts, build/src/hash.ts, core/src/markdown/parse.ts, core/src/ir/transform.ts.
const stages = [
	{ name: "read", body: "Parallel directory walk, xxhash per file" },
	{ name: "parse", body: "remark and rehype, one cached processor" },
	{ name: "sanitize", body: "Allow-list sanitizer, scripts and iframes dropped" },
	{ name: "transform", body: "One pass into a framework-agnostic IR" },
	{ name: "cache", body: "In dev, an unchanged file skips every step above" },
	{ name: "emit", body: "Renderer adapter emits one module per page" },
];

</script>

<Section id="why" number={1} title="why docvia." description="Docs that build, type-check and deploy like the rest of your app.">
	<div class="grid gap-3 lg:grid-cols-5">
		<BentoCard title="Compiled ahead of time" description="Your bundler turns every Markdown file into a module. Nothing parses Markdown in production." class="lg:col-span-2">
			<ol class="divide-y divide-dashed divide-hairline-strong">
				{#each stages as stage, i}
					<li class="flex items-baseline gap-3 py-2.5">
						<span class="font-mono text-xs text-muted tabular-nums">0{i + 1}</span>
						<span class="w-20 shrink-0 font-mono text-sm text-ink">{stage.name}</span>
						<span class="text-sm text-body">{stage.body}</span>
					</li>
				{/each}
			</ol>
		</BentoCard>

		<BentoCard title="Zero config to start" description="init detects your renderer and Shiki. Add a typed config file only when you want to change them." class="lg:col-span-3" bodyClass="p-0">
			<CodeSample name="config.ts" filename="docvia.config.ts" class="border-0" />
		</BentoCard>

		<BentoCard title="Instant edits in dev" description="Edit a page and only that page compiles again: under 70 ms at 300 pages." class="lg:col-span-2">
			<EditDemo />
		</BentoCard>

		<BentoCard title="Typed from your schema" description="Zod, Valibot or ArkType check frontmatter at build, and page.data is typed from the same schema." class="lg:col-span-3" bodyClass="p-0">
			<CodeSample name="source.ts" filename="src/lib/source.ts" class="border-0" />
		</BentoCard>
	</div>
</Section>
