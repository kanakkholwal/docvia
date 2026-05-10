<script lang="ts">
import { BookOpen, Code2, GraduationCap, Library } from "@lucide/svelte";
import { Badge } from "$lib/components/ui/badge";
import { Card } from "$lib/components/ui/card";

const cases = [
	{
		icon: Code2,
		title: "API references",
		body: "Generate fully-typed API docs from Markdown. Embed live components for try-it-yourself examples.",
		example: "/api/v2/users",
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

<section class="border-t border-border/60">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-16 max-w-2xl text-center">
			<Badge variant="accent" class="mb-4">Use cases</Badge>
			<h2
				class="font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				One compiler, many shapes of docs.
			</h2>
			<p class="mt-4 text-lg text-fg-muted">
				The same primitives — collections, frontmatter, plugins — adapt to
				whatever you're publishing.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			{#each cases as useCase}
				<Card class="flex flex-col gap-4 transition-colors hover:border-accent/30">
					<div class="flex items-center gap-3">
						<div
							class="grid h-10 w-10 place-items-center rounded-md bg-accent-subtle text-accent"
						>
							<useCase.icon class="h-5 w-5" />
						</div>
						<h3 class="font-display text-lg font-semibold tracking-tight">
							{useCase.title}
						</h3>
					</div>
					<p class="text-sm leading-relaxed text-fg-muted">
						{useCase.body}
					</p>
					<div
						class="mt-auto rounded-md border border-dashed border-border bg-bg-muted/40 px-3 py-2 font-mono text-xs text-fg-subtle"
					>
						{useCase.example}
					</div>
				</Card>
			{/each}
		</div>
	</div>
</section>
