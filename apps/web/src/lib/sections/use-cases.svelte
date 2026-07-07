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
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<div class="mb-16 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-widest text-muted"
			>
				Use cases
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-display-2 lg:leading-[1.05]"
			>
				One compiler, many shapes of docs.
			</h2>
			<p class="mt-6 max-w-2xl text-lg leading-[1.55] text-body">
				The same primitives — collections, frontmatter, plugins — adapt to
				whatever you're publishing.
			</p>
		</div>

		<div
			class="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline md:grid-cols-2"
		>
			{#each cases as useCase}
				<article
					class="flex flex-col gap-5 bg-canvas p-8 text-ink md:p-10"
				>
					<div class="flex items-center gap-3">
						<div
							class="grid h-11 w-11 place-items-center rounded-md bg-brand-soft text-brand-ink"
						>
							<useCase.icon class="h-5 w-5" />
						</div>
						<h3
							class="font-display text-[24px]"
							style="letter-spacing: -0.02em;"
						>
							{useCase.title}
						</h3>
					</div>
					<p class="text-[15px] leading-[1.55] text-body">
						{useCase.body}
					</p>
					<div
						class="mt-auto rounded-md border border-hairline bg-surface-soft px-3 py-2 font-mono text-[12px] text-body"
					>
						{useCase.example}
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>
