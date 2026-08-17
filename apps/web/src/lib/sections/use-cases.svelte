<script lang="ts">
import { inview } from "$lib/actions/inview";
import { cn } from "$lib/utils";
import { BookOpen, GraduationCap, Library, Terminal } from "@lucide/svelte";

// Each card carries a small artifact of the thing it describes rather than a
// grey pill of sample text: a method badge, a nav tree, real frontmatter, a
// chapter list. Same word count, far more to read at a glance.
const cases = [
	{
		title: "API references",
		body: "Render OpenAPI operations inline from a fenced block. Parameters, schemas, and samples are generated at build time.",
		icon: Terminal,
		kind: "endpoint" as const,
		method: "GET",
		path: "/api/v2/users",
	},
	{
		title: "Product documentation",
		body: "A docs site that lives beside your app code. Same repo, same deploy, same review.",
		icon: BookOpen,
		kind: "tree" as const,
		tree: ["getting-started", "guide/", "packages/"],
	},
	{
		title: "Internal handbooks",
		body: "Wiki-grade content with the rigor of compiled code. Frontmatter is typed and validated on every build.",
		icon: Library,
		kind: "frontmatter" as const,
		fields: [
			{ key: "owner", value: "platform-team" },
			{ key: "reviewed", value: "2026-08-01" },
		],
	},
	{
		title: "Tutorials & courses",
		body: "Long-form content with interactive components embedded through directives.",
		icon: GraduationCap,
		kind: "chapters" as const,
		chapters: [
			{ label: "Fundamentals", count: 4 },
			{ label: "Building", count: 5 },
			{ label: "Shipping", count: 3 },
		],
	},
];

let shown = $state(false);
</script>

<section id="use-cases" class="border-b border-hairline bg-canvas">
	<div class="mx-auto max-w-page px-5 py-14 text-center sm:px-10 sm:py-28">
		<span class="label-meta">Use cases</span>
		<h2
			class="mx-auto mt-4 max-w-2xl text-balance font-display text-[32px] leading-[1.05] tracking-tight text-ink sm:text-[48px] sm:leading-none"
		>
			One compiler, many shapes of docs.
		</h2>
	</div>

	<div
		use:inview
		onenter={() => (shown = true)}
		class="mx-auto grid max-w-page grid-cols-1 gap-px border-t border-hairline bg-hairline md:grid-cols-2"
	>
		{#each cases as useCase, i (useCase.title)}
			{@const Icon = useCase.icon}
			<article
				class={cn(
					"group flex flex-col gap-4 bg-canvas p-5 text-ink transition-colors duration-(--motion-base) ease-out sm:p-10 hover:bg-surface-soft",
					shown && "card-in",
				)}
				style="animation-delay: {i * 70}ms"
			>
				<div class="flex items-center gap-3">
					<span
						class="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-hairline bg-surface-soft text-brand-ink transition-colors duration-(--motion-base) ease-out group-hover:border-hairline-strong group-hover:bg-canvas"
					>
						<Icon class="h-4 w-4" />
					</span>
					<h3 class="font-display text-[24px] leading-[1.1667]">
						{useCase.title}
					</h3>
				</div>

				<p class="text-[16px] leading-[1.75] text-body">{useCase.body}</p>

				<div
					class="mt-auto rounded-md border border-hairline bg-surface-soft p-3 transition-colors duration-(--motion-base) ease-out group-hover:border-hairline-strong group-hover:bg-canvas"
				>
					{#if useCase.kind === "endpoint"}
						<div class="flex items-center gap-2.5 font-mono text-[12px]">
							<span
								class="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-on-brand"
							>
								{useCase.method}
							</span>
							<span class="text-body-strong">{useCase.path}</span>
						</div>
					{:else if useCase.kind === "tree"}
						<ul class="flex flex-col gap-1 font-mono text-[12px] text-body">
							{#each useCase.tree as node, n}
								<li class="flex items-center gap-2">
									<span class="text-muted">
										{n === useCase.tree.length - 1 ? "└─" : "├─"}
									</span>
									{node}
								</li>
							{/each}
						</ul>
					{:else if useCase.kind === "frontmatter"}
						<div class="flex flex-col gap-1 font-mono text-[12px]">
							<span class="text-muted">---</span>
							{#each useCase.fields as field}
								<span>
									<span class="text-brand-ink">{field.key}:</span>
									<span class="text-body-strong">{field.value}</span>
								</span>
							{/each}
						</div>
					{:else}
						<ul class="flex flex-col gap-1.5 font-mono text-[12px]">
							{#each useCase.chapters as chapter}
								<li class="flex items-center gap-2">
									<span class="h-1 w-1 shrink-0 rounded-full bg-brand"></span>
									<span class="text-body-strong">{chapter.label}</span>
									<span class="ml-auto text-muted">
										{chapter.count} lessons
									</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	:global(.js) .card-in {
		opacity: 0;
		animation: card-rise 0.45s var(--ease-out) forwards;
	}

	@keyframes card-rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.js) .card-in {
			opacity: 1;
			animation: none;
			transform: none;
		}
	}
</style>
