<script lang="ts">
import { Check, Minus, X } from "@lucide/svelte";

type Cell = true | false | "partial" | string;

const rows: { feature: string; docvia: Cell; hosted: Cell; diy: Cell }[] = [
	{
		feature: "Self-host on your own infrastructure",
		docvia: true,
		hosted: false,
		diy: true,
	},
	{
		feature: "Framework choice (React, Svelte, more)",
		docvia: true,
		hosted: "Single",
		diy: "Single",
	},
	{
		feature: "Build-time compiled, no runtime parser",
		docvia: true,
		hosted: "partial",
		diy: false,
	},
	{
		feature: "Incremental, content-addressable cache",
		docvia: true,
		hosted: "Cloud only",
		diy: false,
	},
	{
		feature: "Typed frontmatter via Zod schema",
		docvia: true,
		hosted: false,
		diy: false,
	},
	{
		feature: "Pluggable compiler pipeline (5 hooks)",
		docvia: true,
		hosted: false,
		diy: "partial",
	},
	{
		feature: "Bring your own AI keys, no credit metering",
		docvia: true,
		hosted: "Metered",
		diy: "N/A",
	},
	{
		feature: "Open source, MIT licensed",
		docvia: true,
		hosted: false,
		diy: true,
	},
	{
		feature: "Predictable per-seat pricing",
		docvia: true,
		hosted: "Tier jumps",
		diy: "Free",
	},
	{
		feature: "No vendor lock-in",
		docvia: true,
		hosted: false,
		diy: true,
	},
];

function renderCell(value: Cell) {
	if (value === true) return { type: "yes" as const };
	if (value === false) return { type: "no" as const };
	if (value === "partial") return { type: "partial" as const };
	return { type: "text" as const, text: value };
}
</script>

<section id="comparison" class="bg-surface-soft">
	<div class="mx-auto max-w-page px-5 py-24 sm:px-10 md:py-24">
		<!-- Section head -->
		<div class="mb-12 max-w-3xl">
			<span
				class="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
			>
				How docvia compares
			</span>
			<h2
				class="mt-4 font-display text-4xl text-ink md:text-5xl lg:text-[56px] lg:leading-[1.05]"
				style="letter-spacing: -0.03em;"
			>
				The polish of a hosted platform. None of the lock-in.
			</h2>
			<p class="mt-6 max-w-2xl text-lg leading-[1.55] text-body">
				Most hosted docs platforms ship a beautiful theme and an AI agent, then
				lock you into one framework, one cloud, and a per-credit pricing
				model. docvia is the build pipeline underneath, yours to own.
			</p>
		</div>

		<!-- Feature matrix -->
		<div
			class="overflow-hidden rounded-lg border border-hairline bg-canvas"
		>
			<table class="w-full">
				<thead>
					<tr class="border-b border-hairline">
						<th
							class="px-6 py-5 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
						>
							Capability
						</th>
						<th
							class="bg-brand px-6 py-5 text-left text-[13px] font-semibold uppercase tracking-[0.08em] text-on-brand"
						>
							docvia
						</th>
						<th
							class="px-6 py-5 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
						>
							Hosted docs platforms
						</th>
						<th
							class="px-6 py-5 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
						>
							DIY (Docusaurus, etc.)
						</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row, i}
						<tr
							class={i === rows.length - 1
								? ""
								: "border-b border-hairline/60"}
						>
							<td class="px-6 py-4 text-[14px] text-body-strong">
								{row.feature}
							</td>
							{#each [row.docvia, row.hosted, row.diy] as cell, ci}
								{@const c = renderCell(cell)}
								<td
									class={`px-6 py-4 text-[14px] ${ci === 0 ? "bg-brand-soft" : ""}`}
								>
									{#if c.type === "yes"}
										<Check
											class={`h-5 w-5 ${ci === 0 ? "text-check" : "text-muted"}`}
										/>
									{:else if c.type === "no"}
										<X class="h-5 w-5 text-muted-soft" />
									{:else if c.type === "partial"}
										<Minus class="h-5 w-5 text-brand-ink" />
									{:else}
										<span class="text-muted">{c.text}</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="mt-5 text-[13px] text-muted">
			Comparison reflects publicly documented capabilities of category leaders.
			"Hosted docs platforms" refers to managed, cloud-only documentation SaaS.
		</p>
	</div>
</section>
