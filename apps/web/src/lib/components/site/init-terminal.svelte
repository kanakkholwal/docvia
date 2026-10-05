<script lang="ts">
import setup from "#lib/benchmarks/setup.json";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#lib/components/ui/select/index.ts";
import { onMount, untrack } from "svelte";

// Transcripts follow packages/cli/src/commands/init.ts and planFiles(); file counts match setup.json.
const FRAMEWORKS = {
	next: {
		label: "Next.js",
		routes: "app/docs/",
		port: 3000,
		files: [
			"lib/source.ts",
			"components/docs-tree.tsx",
			"components/docvia-client.tsx",
			"app/docs/[[...slug]]/page.tsx",
			"app/docs/layout.tsx",
			"app/docs/docs.css",
			"app/api/search/route.ts",
		],
		config: "next.config.ts",
		css: "app/globals.css",
	},
	sveltekit: {
		label: "SvelteKit",
		routes: "src/routes/docs/",
		port: 5173,
		files: [
			"src/lib/source.ts",
			"src/routes/docs/+layout.server.ts",
			"src/routes/docs/+layout.svelte",
			"src/routes/docs/[...slug]/+page.server.ts",
			"src/routes/docs/[...slug]/+page.svelte",
			"src/routes/docs/docs.css",
			"src/routes/api/search/+server.ts",
		],
		config: "vite.config.ts",
		css: null,
	},
	"tanstack-start": {
		label: "TanStack Start",
		routes: "src/routes/docs/",
		port: 3000,
		files: [
			"src/lib/source.ts",
			"src/components/docs-tree.tsx",
			"src/components/docvia-client.tsx",
			"src/routes/docs/route.tsx",
			"src/routes/docs/$.tsx",
			"src/routes/docs/-docs.css",
			"src/routes/api/search.ts",
		],
		config: "vite.config.ts",
		css: "src/styles.css",
	},
} as const;
type Framework = keyof typeof FRAMEWORKS;
const MANAGERS = {
	pnpm: { run: "pnpm dlx", dev: "pnpm dev" },
	npm: { run: "npx", dev: "npm run dev" },
	bun: { run: "bunx", dev: "bun dev" },
	yarn: { run: "yarn dlx", dev: "yarn dev" },
} as const;
type Manager = keyof typeof MANAGERS;
const CONTENT = ["content/docs/index.md", "content/docs/guides/writing.md", "content/docs/guides/meta.json"];

let framework = $state<Framework>("next");
let manager = $state<Manager>("pnpm");

type Line = { kind: "rail" | "head" | "kv" | "file" | "note" | "done" | "spin"; a?: string; b?: string };
const secs = (ms?: number) => (ms ? ` in ${(ms / 1000).toFixed(2)}s` : "");

// Timings exist only for pnpm (setup.json); other managers show the same lines without a duration.
function transcript(fw: Framework, pm: Manager): Line[] {
	const f = FRAMEWORKS[fw];
	const timing = pm === "pnpm" ? setup.frameworks.find((s) => s.framework === f.label) : undefined;
	const files: Line[] = [...CONTENT, ...f.files].map((b) => ({ kind: "file", b }));
	files.push({ kind: "file", b: f.config, a: "(updated)" });
	if (f.css) files.push({ kind: "file", b: f.css, a: "(Tailwind skips content/)" });
	return [
		{ kind: "head", a: "┌", b: "Add docs to your app" },
		{ kind: "rail" },
		{ kind: "head", a: "◇", b: "my-app" },
		{ kind: "kv", a: "framework", b: f.label },
		{ kind: "kv", a: "packages ", b: `${pm} (lockfile)` },
		{ kind: "kv", a: "content  ", b: "content/docs" },
		{ kind: "kv", a: "routes   ", b: f.routes },
		{ kind: "rail" },
		{ kind: "head", a: "◇", b: `${files.length} file(s)` },
		...files,
		{ kind: "rail" },
		{ kind: "spin", a: `Installing 5 packages with ${pm}`, b: `Installed with ${pm}${secs(timing?.installMs)}` },
		{ kind: "rail" },
		{ kind: "head", a: "◇", b: "Next" },
		{ kind: "note", a: MANAGERS[pm].dev, b: `then open http://localhost:${f.port}/docs` },
		{ kind: "rail" },
		{ kind: "done", a: "└", b: `Done${secs(timing?.initMs)}` },
	];
}

const lines = $derived(transcript(framework, manager));
const command = $derived(`${MANAGERS[manager].run} @docvia/cli init`);

// SSR and reduced motion show the whole transcript; the stream only replays it in the browser.
let typed = $state(Number.POSITIVE_INFINITY);
let shown = $state(Number.POSITIVE_INFINITY);
let installing = $state(false);
let frame = $state(0);
let hovering = $state(false);
let inView = $state(true);
let run = 0;
let root: HTMLElement;
let body: HTMLElement;
let animate = $state(false);

const sleep = (ms: number, id: number) =>
	new Promise<boolean>((resolve) => {
		const check = () => (id !== run ? resolve(false) : hovering || !inView ? setTimeout(check, 200) : resolve(true));
		setTimeout(check, ms);
	});

async function stream() {
	const id = ++run;
	while (id === run) {
		typed = 0;
		shown = 0;
		for (let i = 1; i <= command.length; i++) {
			if (!(await sleep(40, id))) return;
			typed = i;
		}
		if (!(await sleep(350, id))) return;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.kind === "spin") {
				installing = true;
				shown = i + 1;
				if (!(await sleep(1400, id))) return;
				installing = false;
			} else {
				if (!(await sleep(line.kind === "file" ? 70 : 140, id))) return;
				shown = i + 1;
			}
			body?.scrollTo({ top: body.scrollHeight });
		}
		if (!(await sleep(3200, id))) return;
	}
}

// baby-ui's Svelte Select has no onValueChange yet, so a change to either value restarts the stream here.
$effect(() => {
	framework;
	manager;
	if (animate) untrack(stream);
});

const frameworkItems = Object.entries(FRAMEWORKS).map(([value, f]) => ({ value, label: f.label }));
const managerItems = Object.keys(MANAGERS).map((value) => ({ value, label: value }));

const pickOne = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

onMount(() => {
	framework = pickOne(Object.keys(FRAMEWORKS) as Framework[]);
	manager = pickOne(Object.keys(MANAGERS) as Manager[]);
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	const io = new IntersectionObserver(([e]) => (inView = e?.isIntersecting ?? false));
	io.observe(root);
	const spinner = setInterval(() => (frame = (frame + 1) % 4), 120);
	animate = true;
	return () => {
		run++;
		clearInterval(spinner);
		io.disconnect();
	};
});
</script>

<div
	bind:this={root}
	class="rounded-2xl bg-well-rim p-1 shadow-surface"
	role="group"
	aria-label="docvia init, streamed"
	onpointerenter={() => (hovering = true)}
	onpointerleave={() => (hovering = false)}
>
	<div class="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 pb-1.5">
		<span class="px-1 font-mono text-xs text-muted">~/my-app</span>
		<div class="flex items-center gap-0.5">
			<Select type="single" bind:value={framework as string} items={frameworkItems}>
				<SelectTrigger variant="ghost" size="xs" aria-label="Framework" class="font-mono text-muted hover:text-ink">
					<SelectValue />
				</SelectTrigger>
				<SelectContent size="xs">
					{#each frameworkItems as item}<SelectItem value={item.value} label={item.label} />{/each}
				</SelectContent>
			</Select>
			<Select type="single" bind:value={manager as string} items={managerItems}>
				<SelectTrigger variant="ghost" size="xs" aria-label="Package manager" class="font-mono text-muted hover:text-ink">
					<SelectValue />
				</SelectTrigger>
				<SelectContent size="xs">
					{#each managerItems as item}<SelectItem value={item.value} label={item.label} />{/each}
				</SelectContent>
			</Select>
		</div>
	</div>
	<div
		bind:this={body}
		aria-live="off"
		class="no-scrollbar h-[400px] overflow-y-auto rounded-xl bg-well-body p-5 font-mono text-[13px] leading-[1.7] ring-1 ring-ink/[0.04] [&>p]:whitespace-pre"
	>
		<p>
			<span class="text-muted">$</span> <span class="text-ink">{command.slice(0, typed)}</span>{#if typed < command.length}<span class="caret">▍</span>{/if}
		</p>
		{#each lines.slice(0, shown) as line, i (`${framework}-${manager}-${i}`)}
			<p class="line">
				{#if line.kind === "rail"}
					<span class="text-muted">│</span>
				{:else if line.kind === "head" || line.kind === "done"}
					<span class="text-success">{line.a}</span>  <span class="font-medium text-ink">{line.b}</span>
				{:else if line.kind === "kv"}
					<span class="text-muted">│</span>  <span class="text-muted">{line.a}</span>  <span class="text-ink">{line.b}</span>
				{:else if line.kind === "file"}
					<span class="text-muted">│</span>  <span class="text-success">+</span> <span class="text-ink">{line.b}</span>{#if line.a}{" "}<span class="text-muted">{line.a}</span>{/if}
				{:else if line.kind === "spin"}
					{#if installing && i === shown - 1}
						<span class="text-brand-ink">{"◒◐◓◑"[frame]}</span>  <span class="text-body">{line.a}</span>
					{:else}
						<span class="text-success">◇</span>  <span class="text-ink">{line.b}</span>
					{/if}
				{:else if line.kind === "note"}
					<span class="text-muted">│</span>  <span class="text-brand-ink">{line.a}</span>  <span class="text-muted">{line.b}</span>
				{/if}
			</p>
		{/each}
	</div>
</div>

<style>
	.line {
		animation: line-in var(--duration-fast) var(--ease-out) both;
	}
	@keyframes line-in {
		from {
			opacity: 0;
			translate: 0 2px;
		}
	}
	.caret {
		color: var(--brand-ink);
		animation: blink 1s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line,
		.caret {
			animation: none;
		}
	}
</style>
