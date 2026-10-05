<script lang="ts">
import { RollText } from "#lib/components/text/roll-text/index.ts";
import { VERSION } from "#lib/version.ts";
import { ArrowUp } from "@lucide/svelte";

const columns = [
	{
		title: "Product",
		links: [
			{ label: "Why docvia", href: "/#why" },
			{ label: "Renderers", href: "/#renderers" },
			{ label: "Numbers", href: "/#numbers" },
			{ label: "Quickstart", href: "/#quickstart" },
		],
	},
	{
		title: "Docs",
		links: [
			{ label: "Getting started", href: "/docs/getting-started" },
			{ label: "Configuration", href: "/docs/guide/configuration" },
			{ label: "Architecture", href: "/docs/guide/architecture" },
			{ label: "Packages", href: "/docs/packages" },
		],
	},
	{
		title: "Community",
		links: [
			{ label: "GitHub", href: "https://github.com/kanakkholwal/docvia" },
			{ label: "npm", href: "https://www.npmjs.com/org/docvia" },
			{ label: "Issues", href: "https://github.com/kanakkholwal/docvia/issues" },
			{ label: "Changelog", href: "https://github.com/kanakkholwal/docvia/releases" },
		],
	},
];

function toTop() {
	const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
	window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
	document.getElementById("main")?.focus({ preventScroll: true });
}
</script>

<footer class="mx-auto w-full max-w-page px-5 pb-10 sm:px-10 lg:px-16">
	<div class="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-dashed border-hairline-strong pt-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
		<div class="col-span-2 flex flex-col gap-3 sm:col-span-1">
			<p class="font-pixel text-2xl text-ink">docvia.</p>
			<p class="max-w-64 text-sm text-pretty text-muted">
				Markdown docs, built into your React or Svelte app. No second site to host.
			</p>
			<p class="font-mono text-xs text-muted tabular-nums">CLI v{VERSION} · packages MIT</p>
		</div>
		{#each columns as col}
			<nav aria-label={col.title} class="dim-list flex flex-col gap-2.5 text-sm">
				<p class="font-mono text-xs text-muted">{col.title}</p>
				{#each col.links as link}
					<a
						href={link.href}
						class="group/roll w-fit text-muted transition-colors duration-(--duration-fast) hover:text-ink"
						{...link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}}
					>
						<RollText text={link.label} groupHover size="sm" class="cursor-[inherit]" />
					</a>
				{/each}
			</nav>
		{/each}
	</div>
	<div class="mt-12 flex items-center justify-between gap-4 font-mono text-xs text-muted">
		<span>© {new Date().getFullYear()} docvia</span>
		<button type="button" onclick={toTop} class="group/roll inline-flex items-center gap-1 transition-colors hover:text-ink">
			<RollText text="Back to top" groupHover size="sm" class="cursor-[inherit] text-xs" />
			<ArrowUp class="size-3.5 transition-transform duration-(--duration-fast) ease-(--ease-out) group-hover/roll:-translate-y-0.5" />
		</button>
	</div>
</footer>
