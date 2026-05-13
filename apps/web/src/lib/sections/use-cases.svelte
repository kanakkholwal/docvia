<script lang="ts">
import { BookOpen, Code2, GraduationCap, Library } from "@lucide/svelte";

type Card = {
	icon: typeof Code2;
	title: string;
	body: string;
	example: string;
	bg: string;
	textTone: "dark" | "light";
};

const cases: Card[] = [
	{
		icon: Code2,
		title: "API references",
		body: "Generate fully-typed API docs from Markdown. Embed live examples inline via the OpenAPI plugin.",
		example: "GET  /api/v2/users",
		bg: "bg-brand-pink",
		textTone: "light",
	},
	{
		icon: BookOpen,
		title: "Product documentation",
		body: "Ship a polished docs site that lives next to your app code. Same repo, same deploy, same review process.",
		example: "Quickstart · Guides · How-tos",
		bg: "bg-brand-peach",
		textTone: "dark",
	},
	{
		icon: Library,
		title: "Internal handbooks",
		body: "Wiki-grade content with the rigor of compiled code. Link checking, typed frontmatter, search by default.",
		example: "Engineering handbook",
		bg: "bg-brand-lavender",
		textTone: "dark",
	},
	{
		icon: GraduationCap,
		title: "Tutorials & courses",
		body: "Long-form learning content with embedded interactive components and predictable navigation.",
		example: "12 lessons · 4 chapters",
		bg: "bg-brand-mint",
		textTone: "dark",
	},
];
</script>

<section id="use-cases" class="bg-canvas">
	<div class="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-24">
		<div class="mb-16 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-widest text-muted"
			>
				Use cases
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-[56px] lg:leading-[1.05]"
				style="letter-spacing: -0.03em;"
			>
				One compiler, many shapes of docs.
			</h2>
			<p class="mt-6 max-w-2xl text-lg leading-[1.55] text-body">
				The same primitives — collections, frontmatter, plugins — adapt to
				whatever you're publishing.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			{#each cases as useCase}
				{@const isDark = useCase.textTone === "light"}
				<article
					class={`flex flex-col gap-5 rounded-xl p-8 ${useCase.bg} ${isDark ? "text-card-on-dark" : "text-card-on-light"}`}
				>
					<div class="flex items-center gap-3">
						<div
							class={`grid h-11 w-11 place-items-center rounded-md ${
								isDark ? "bg-white/15 text-card-on-dark" : "bg-black/10 text-card-on-light"
							}`}
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
					<p
						class={`text-[15px] leading-[1.55] ${
							isDark ? "text-card-on-dark/85" : "text-card-on-light/75"
						}`}
					>
						{useCase.body}
					</p>
					<div
						class={`mt-auto rounded-md px-3 py-2 font-mono text-[12px] ${
							isDark ? "bg-white/15 text-card-on-dark" : "bg-white/60 text-card-on-light"
						}`}
					>
						{useCase.example}
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>
