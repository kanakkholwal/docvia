<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Check, Minus } from "@lucide/svelte";

	const rows = [
		{ feature: "Build-time compilation", docvia: true, others: false },
		{ feature: "Incremental cache between runs", docvia: true, others: false },
		{ feature: "Typed frontmatter via Zod", docvia: true, others: false },
		{ feature: "Framework-agnostic IR", docvia: true, others: false },
		{ feature: "Bring your own renderer", docvia: true, others: false },
		{ feature: "Strict HTML sanitization", docvia: true, others: true },
		{ feature: "Section-level full-text search", docvia: true, others: true },
		{ feature: "Open source MIT", docvia: true, others: true },
	];
</script>

<section class="border-t border-border/60 bg-bg-subtle/30">
	<div class="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto mb-12 max-w-2xl text-center">
			<Badge variant="accent" class="mb-4">How docvia compares</Badge>
			<h2
				class="font-display text-4xl font-semibold tracking-tight md:text-5xl"
			>
				Designed for the build pipeline.
			</h2>
			<p class="mt-4 text-lg text-fg-muted">
				A clean separation: the compiler does the heavy lifting at build
				time, your framework does what it does best at request time.
			</p>
		</div>

		<div
			class="overflow-hidden rounded-xl border border-border bg-bg-subtle"
		>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-bg-muted/30">
						<th
							class="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.05em] text-fg-muted"
						>
							Capability
						</th>
						<th
							class="px-6 py-4 text-center text-xs font-medium uppercase tracking-[0.05em] text-accent"
						>
							docvia
						</th>
						<th
							class="px-6 py-4 text-center text-xs font-medium uppercase tracking-[0.05em] text-fg-muted"
						>
							Typical alternatives
						</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row, i}
						<tr
							class={i === rows.length - 1
								? ""
								: "border-b border-border/60"}
						>
							<td class="px-6 py-3.5 text-fg">{row.feature}</td>
							<td class="px-6 py-3.5 text-center">
								{#if row.docvia}
									<Check class="mx-auto h-4 w-4 text-accent" />
								{:else}
									<Minus class="mx-auto h-4 w-4 text-fg-subtle" />
								{/if}
							</td>
							<td class="px-6 py-3.5 text-center">
								{#if row.others}
									<Check class="mx-auto h-4 w-4 text-fg-muted" />
								{:else}
									<Minus class="mx-auto h-4 w-4 text-fg-subtle" />
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="mt-4 text-center text-xs text-fg-subtle">
			Comparison reflects the v0.1 preview. Capabilities of other tools vary
			and evolve.
		</p>
	</div>
</section>
