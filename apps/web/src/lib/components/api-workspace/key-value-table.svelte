<script lang="ts">
import { Plus, X } from "@lucide/svelte";
import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
import { cn } from "#lib/cn.js";
import { type Row, row } from "./workspace.svelte.ts";

// Rows are edited in place; the parent owns the array and persists it.
let {
	rows,
	label,
	addable = true,
	toggleable = true,
	onchange,
}: {
	rows: Row[];
	label: string;
	addable?: boolean;
	toggleable?: boolean;
	onchange?: () => void;
} = $props();

const CELL =
	"h-9 w-full min-w-0 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted focus-visible:bg-foreground/[0.04]";

function remove(id: string) {
	const index = rows.findIndex((r) => r.id === id);
	if (index !== -1) rows.splice(index, 1);
	onchange?.();
}

function add() {
	rows.push(row());
	onchange?.();
}
</script>

<div class="divide-y divide-border text-sm" role="table" aria-label={label}>
	{#each rows as r (r.id)}
		<div role="row" class={cn("group/row flex items-center", !r.enabled && "opacity-60")}>
			{#if toggleable}
				<div class="flex w-9 shrink-0 justify-center" role="cell">
					<Checkbox
						size="sm"
						bind:checked={
							() => r.enabled,
							(v) => {
								r.enabled = v;
								onchange?.();
							}
						}
						disabled={r.required}
						aria-label={`Send ${r.name || "this row"}`}
					/>
				</div>
			{/if}
			<div role="cell" class="flex w-2/5 min-w-0 items-center border-border border-r">
				{#if r.fixed}
					<span class="flex min-w-0 items-center gap-1 truncate px-3 font-medium text-ink">
						{r.name}{#if r.required}<span class="text-warning-strong" aria-label="required">*</span>{/if}
					</span>
				{:else}
					<input class={CELL} bind:value={r.name} placeholder="Key" aria-label="Key" oninput={() => onchange?.()} />
				{/if}
			</div>
			<div role="cell" class="flex min-w-0 flex-1 items-center">
				<input
					class={CELL}
					bind:value={r.value}
					placeholder={r.hint ?? "Value"}
					aria-label={`${r.name || "Row"} value`}
					oninput={() => {
						if (r.value) r.enabled = true;
						onchange?.();
					}}
				/>
				{#if !r.fixed}
					<button
						type="button"
						class="mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-foreground/[0.06] hover:text-ink focus-visible:opacity-100 group-hover/row:opacity-100"
						aria-label={`Remove ${r.name || "row"}`}
						onclick={() => remove(r.id)}
					>
						<X class="size-3.5" />
					</button>
				{/if}
			</div>
		</div>
	{/each}
	{#if addable}
		<button
			type="button"
			class="flex h-9 w-full items-center gap-2 px-3 text-left text-muted text-sm transition-colors hover:bg-foreground/[0.04] hover:text-ink"
			onclick={add}
		>
			<Plus class="size-3.5" /> Add {label.toLowerCase()}
		</button>
	{/if}
</div>
