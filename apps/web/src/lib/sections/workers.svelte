<script lang="ts">
import data from "#lib/benchmarks/comparison.json";
import CodeSample from "#lib/components/code-sample.svelte";
import BentoCard from "#lib/components/site/bento-card.svelte";
import Section from "#lib/components/site/section.svelte";
import { Check } from "@lucide/svelte";
import { onMount } from "svelte";

// Cloudflare's per-isolate memory limit; rows are comparison.json at the largest page count.
const LIMIT_MB = 128;
const pages = Math.max(...data.vite.map((r) => r.pages));
const rows = [
	{ tool: "fumadocs async", label: "fumadocs" },
	{ tool: "docvia react", label: "docvia + React" },
	{ tool: "docvia svelte", label: "docvia + Svelte" },
].map((t) => {
	const r = data.vite.find((v) => v.tool === t.tool && v.pages === pages);
	return { ...t, heap: Number(r?.heapMB ?? 0), cold: Number(r?.ssrImport ?? 0) };
});

// Each line is enforced or proven in code: runtime/src/emit.ts, scripts/pack-smoke.mjs, plugin-shiki, search.
const checks = [
	"No createRequire or yaml in the server bundle, checked in CI",
	"Highlighting is baked in at build, so no Shiki at runtime",
	"Search builds once per isolate from compiled data",
	"Docs pages can prerender to static assets",
];

// The diagram: one eager index, then one lazy chunk per page; a request loads only its chunk.
const CHUNKS = 96;
let lit = $state(-1);
onMount(() => {
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	const timer = setInterval(() => (lit = Math.floor(Math.random() * CHUNKS)), 900);
	return () => clearInterval(timer);
});
</script>

<Section id="workers" number={5} title="built for workers." description="A Worker isolate gets 128 MB and pays for every cold start. docvia keeps page bodies out of the startup path, so docs fit with room to spare.">
	<div class="grid gap-3 lg:grid-cols-5">
		<BentoCard title="Lazy page bodies" description="The server bundle eagerly loads a small frontmatter index. Each page body is its own chunk, loaded when that page is requested." class="lg:col-span-3">
			<div class="flex flex-1 flex-col justify-center gap-4">
				<div>
					<p class="mb-2 font-mono text-xs text-muted">startup</p>
					<div class="flex h-6 items-center rounded-md bg-brand/15 px-2 font-mono text-xs text-brand-ink ring-1 ring-brand/30">
						frontmatter index, {pages.toLocaleString("en")} entries
					</div>
				</div>
				<div>
					<p class="mb-2 font-mono text-xs text-muted">on request, one chunk per page</p>
					<div class="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1" aria-hidden="true">
						{#each Array(CHUNKS) as _, i}
							<span class="chunk aspect-square rounded-[3px] bg-well-rim" data-lit={i === lit}></span>
						{/each}
					</div>
					<p class="mt-2 font-mono text-xs text-muted">{CHUNKS} of {pages.toLocaleString("en")} chunks shown</p>
				</div>
			</div>
		</BentoCard>

		<BentoCard title="{pages.toLocaleString('en')} pages, {LIMIT_MB} MB limit" description="Heap after importing the server bundle, and the cold import time. Bars are to scale." class="lg:col-span-2">
			<div class="flex flex-1 flex-col justify-center gap-4">
				{#each rows as row}
					<div>
						<div class="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-xs">
							<span class={row.tool.startsWith("docvia") ? "text-ink" : "text-muted"}>{row.label}</span>
							<span class="text-muted tabular-nums">{row.heap} MB · {row.cold} ms</span>
						</div>
						<div class="h-2 overflow-hidden rounded-full bg-well-rim">
							<div
								class="meter h-full rounded-full {row.tool.startsWith('docvia') ? 'bg-brand' : 'bg-muted-soft'}"
								style="--w: {(row.heap / LIMIT_MB) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</BentoCard>

		<BentoCard title="Search on the edge" description="A standard Request handler. The index is built in memory from data compiled into the bundle." class="lg:col-span-3" bodyClass="p-0">
			<CodeSample name="search-worker.ts" filename="src/routes/api/search/+server.ts" class="border-0" />
		</BentoCard>

		<BentoCard title="What keeps it small" description="Constraints in the design, not deploy-time workarounds." class="lg:col-span-2">
			<ul class="divide-y divide-dashed divide-hairline-strong">
				{#each checks as item}
					<li class="flex items-start gap-3 py-2.5 text-sm text-body">
						<Check class="mt-0.5 size-4 shrink-0 text-success" />
						{item}
					</li>
				{/each}
			</ul>
		</BentoCard>
	</div>
</Section>

<style>
	.meter {
		width: var(--w);
		animation: fill var(--duration-slow) var(--ease-out) both 200ms;
	}
	@keyframes fill {
		from {
			width: 0;
		}
	}
	.chunk {
		transition:
			background-color var(--duration-slow) var(--ease-out),
			scale var(--duration-slow) var(--ease-out);
	}
	.chunk[data-lit="true"] {
		background-color: var(--brand);
		scale: 1.15;
	}
	@media (prefers-reduced-motion: reduce) {
		.meter {
			animation: none;
		}
	}
</style>
