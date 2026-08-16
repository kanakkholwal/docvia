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
	<div class="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
		<div class="mb-14 max-w-3xl">
			<span class="label-meta">Use cases</span>
			<h2
				class="mt-4 font-display text-[36px] text-ink md:text-[48px]"
				style="line-height: 1.05; letter-spacing: -0.04em;"
			>
				One compiler, many shapes of docs.
			</h2>
			<p class="mt-6 max-w-2xl text-[18px] leading-[1.56] text-body">
				The same primitives (collections, frontmatter, plugins) adapt to
				whatever you're publishing.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each cases as useCase}
				<article
					class="flex flex-col gap-5 rounded-md border border-hairline bg-surface-soft p-6 text-ink transition-colors duration-(--motion-base) ease-out hover:border-hairline-strong md:p-8"
				>
					<div class="flex items-center gap-3">
						<div
							class="grid h-10 w-10 place-items-center rounded-md border border-hairline bg-canvas text-brand-ink"
						>
							<useCase.icon class="h-5 w-5" />
						</div>
						<h3
							class="font-display text-[22px]"
							style="line-height: 1.2; letter-spacing: -0.03em;"
						>
							{useCase.title}
						</h3>
					</div>
					<p class="text-[15px] leading-[1.6] text-body">
						{useCase.body}
					</p>
					<div
						class="mt-auto rounded-md border border-hairline bg-canvas px-3 py-2 font-mono text-[12px] text-body"
					>
						{useCase.example}
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>
