<svelte:options namespace="svg" />

<script lang="ts">
import { CHART_EASE } from "#lib/components/charts/chart/motion.js";
import { ENTER_MS, type Rect, squareColumn, squareDelay } from "./bar-core";
import type { DisplayedBar } from "./context";

let { d, vertical, color }: { d: DisplayedBar; vertical: boolean; color: string } =
	$props();

const SQUARE_RADIUS = 0.25;
const size = $derived(vertical ? d.rect.width : d.rect.height);
const cells = $derived(squareColumn(vertical ? d.rect.height : d.rect.width, size));
const negative = $derived(d.target.value < 0);

/** Bar squares: cells cascade bottom to top over 40% of the entrance. */
function cell(offset: number, j: number): Rect {
	const p =
		d.elapsed === null
			? 1
			: CHART_EASE(
					Math.min(1, Math.max(0, (d.elapsed - squareDelay(j, cells.length)) / ENTER_MS)),
				);
	const grown = size * p;
	if (vertical) {
		const edge = negative ? d.rect.y + offset : d.rect.y + d.rect.height - offset;
		return { x: d.rect.x, y: negative ? edge : edge - grown, width: size, height: grown };
	}
	const edge = negative ? d.rect.x + d.rect.width - offset : d.rect.x + offset;
	return { x: negative ? edge - grown : edge, y: d.rect.y, width: grown, height: size };
}
</script>

{#each cells as offset, j (j)}
	{@const c = cell(offset, j)}
	<rect
		x={c.x}
		y={c.y}
		width={Math.max(0, c.width)}
		height={Math.max(0, c.height)}
		rx={size * SQUARE_RADIUS}
		fill={color}
	/>
{/each}
