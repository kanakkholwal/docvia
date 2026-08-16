<script lang="ts">
import { BookOpen, Code2, GraduationCap, Library } from "@lucide/svelte";

type Card = {
	icon: typeof Code2;
	title: string;
	body: string;
	example: string;
};

const cases: Card[] = [
	{
		icon: Code2,
		title: "API references",
		body: "Generate fully-typed API docs from Markdown. Embed live examples inline via the OpenAPI plugin.",
		example: "GET  /api/v2/users",
	},
	{
		icon: BookOpen,
		title: "Product documentation",
		body: "Ship a polished docs site that lives next to your app code. Same repo, same deploy, same review process.",
		example: "Quickstart · Guides · How-tos",
	},
	{
		icon: Library,
		title: "Internal handbooks",
		body: "Wiki-grade content with the rigor of compiled code. Link checking, typed frontmatter, search by default.",
		example: "Engineering handbook",
	},
	{
		icon: GraduationCap,
		title: "Tutorials & courses",
		body: "Long-form learning content with embedded interactive components and predictable navigation.",
		example: "12 lessons · 4 chapters",
	},
];
</script>

<section id="use-cases" class="border-b border-hairline bg-canvas">
	<div class="mx-auto max-w-page px-5 py-14 text-center sm:px-10 sm:py-28">
		<span class="label-meta">Use cases</span>
		<h2
			class="mx-auto mt-4 max-w-2xl text-balance font-display text-[32px] leading-[1.05] tracking-[-0.025em] text-ink sm:text-[48px] sm:leading-none"
		>
			One compiler, many shapes of docs.
		</h2>
		<p class="mx-auto mt-6 max-w-2xl text-[18px] leading-7 text-body">
			The same primitives (collections, frontmatter, plugins) adapt to whatever
			you're publishing.
		</p>
	</div>

	<div
		class="mx-auto grid max-w-page grid-cols-1 gap-px border-t border-hairline bg-hairline md:grid-cols-2"
	>
		{#each cases as useCase}
			<article class="flex flex-col gap-5 bg-canvas p-5 text-ink sm:p-10">
				<div class="flex items-center gap-3">
					<div
						class="grid h-10 w-10 place-items-center rounded-md border border-hairline bg-surface-soft text-brand-ink"
					>
						<useCase.icon class="h-5 w-5" />
					</div>
					<h3 class="font-display text-[24px] leading-[1.1667]">
						{useCase.title}
					</h3>
				</div>
				<p class="text-[16px] leading-[1.75] text-body">{useCase.body}</p>
				<div
					class="mt-auto rounded-md border border-hairline bg-surface-soft px-3 py-2 font-mono text-[12px] text-body"
				>
					{useCase.example}
				</div>
			</article>
		{/each}
	</div>
</section>
