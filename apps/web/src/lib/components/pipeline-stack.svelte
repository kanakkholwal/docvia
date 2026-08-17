<script lang="ts">
import { onMount } from "svelte";
import ShaderField from "./shader-field.svelte";

// Isometric projection: (x, y, z) -> (cx + (x-y)·cos30, cy + (x+y)·sin30 - z).
// An SVG matrix reproduces it exactly, so every plane stays a plain <rect rx>
// and the corner rounding shears correctly instead of being faked with paths.
const S = 88; // plane half-size
const CX = 200;
const CY = 305;
const iso = (z: number) => `matrix(0.866 0.5 -0.866 0.5 ${CX} ${CY - z})`;

// Slabs are two stacked rects: a violet one at z, a face at z + THICK. The
// violet edge peeking out below is the extrusion, which is what gives the
// bottom layer weight instead of looking like a flat outline.
const THICK = 13;

const floaters = [
	{ label: ".MDX", accent: true, delay: "0s" },
	{ label: ".MD", accent: false, delay: "-4.1s" },
];

const CHIP = 20;
const CHIP_T = 7;
const emits = [
	{ label: ".TSX", cx: 92, cy: 250 },
	{ label: ".SVELTE", cx: 96, cy: 412 },
	{ label: ".HTML", cx: 306, cy: 412 },
];

let root: HTMLElement | undefined = $state();
let paused = $state(true); // parked until the observer says it is on screen

// The descent loops endlessly by design, so it at least must not run off-screen.
onMount(() => {
	if (!root) return;
	const io = new IntersectionObserver(([e]) => (paused = !e.isIntersecting), {
		threshold: 0.2,
	});
	io.observe(root);
	return () => io.disconnect();
});
</script>

<div
	bind:this={root}
	class="relative isolate w-full overflow-hidden"
	class:paused
>
	<ShaderField intensity={1} />

	<svg
		viewBox="0 0 400 470"
		class="relative mx-auto w-full max-w-110"
		role="img"
		aria-labelledby="pipeline-title pipeline-desc"
	>
		<title id="pipeline-title">The docvia compile pipeline</title>
		<desc id="pipeline-desc">
			Markdown and MDX source layers descend onto the docvia compiler, which
			emits React, Svelte and static HTML.
		</desc>

		<!-- Connectors sit under everything so the chips read as attached. -->
		<g stroke="var(--hairline-strong)" stroke-width="1" opacity="0.65">
			{#each emits as e}
				<line x1={CX} y1={CY} x2={e.cx} y2={e.cy} />
			{/each}
		</g>

		<!-- Base slab: the compiler. Everything resolves into this. -->
		<g class="base">
			<rect
				x={-S}
				y={-S}
				width={S * 2}
				height={S * 2}
				rx="22"
				transform={iso(0)}
				class="slab-side"
			/>
			<g transform={iso(THICK)}>
				<rect x={-S} y={-S} width={S * 2} height={S * 2} rx="22" class="slab-face" />
				<rect
					x={-S * 0.46}
					y={-S * 0.46}
					width={S * 0.92}
					height={S * 0.92}
					rx="12"
					class="inset"
				/>
				<text x="0" y={S * 0.62} text-anchor="middle" class="plane-label">
					.DOCVIA
				</text>
			</g>
		</g>

		<!-- Falling source layers, outline only so they read as glass. The CSS
		     transform is on an outer group so it composes with the iso matrix
		     rather than overwriting it. -->
		{#each floaters as f}
			<g class="descend" style="animation-delay: {f.delay}">
				<g transform={iso(0)}>
					<rect
						x={-S}
						y={-S}
						width={S * 2}
						height={S * 2}
						rx="22"
						class="plane-float"
						class:accent={f.accent}
					/>
					<text x="0" y={S * 0.62} text-anchor="middle" class="plane-label float">
						{f.label}
					</text>
				</g>
			</g>
		{/each}

		<!-- Emitted targets, small slabs with the same extrusion. -->
		{#each emits as e}
			<g class="chip">
				<rect
					x={-CHIP}
					y={-CHIP}
					width={CHIP * 2}
					height={CHIP * 2}
					rx="7"
					transform={`matrix(0.866 0.5 -0.866 0.5 ${e.cx} ${e.cy})`}
					class="slab-side"
				/>
				<g transform={`matrix(0.866 0.5 -0.866 0.5 ${e.cx} ${e.cy - CHIP_T})`}>
					<rect
						x={-CHIP}
						y={-CHIP}
						width={CHIP * 2}
						height={CHIP * 2}
						rx="7"
						class="slab-face"
					/>
					<text x="0" y={CHIP * 0.55} text-anchor="middle" class="chip-label">
						{e.label}
					</text>
				</g>
			</g>
		{/each}
	</svg>
</div>

<style>
	/* The extruded side. Sits one THICK below its face, so only the bottom rim
	   shows. */
	.slab-side {
		fill: var(--brand-strong);
	}
	.slab-face {
		fill: var(--surface-card);
		stroke: var(--brand);
		stroke-width: 1.25;
	}
	.inset {
		fill: none;
		stroke: var(--hairline-strong);
		stroke-width: 1;
		opacity: 0.7;
	}

	.plane-float {
		fill: none;
		stroke: var(--hairline-strong);
		stroke-width: 1.25;
	}
	.plane-float.accent {
		stroke: var(--brand);
	}

	/* Labels live inside the iso group, so they shear with the plane. That skew
	   is the look, not a bug. */
	.plane-label {
		fill: var(--muted);
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.14em;
	}
	.chip-label {
		fill: var(--body);
		font-family: var(--font-mono);
		font-size: 8px;
		font-weight: 500;
		letter-spacing: 0.1em;
	}

	.base .slab-face {
		filter: drop-shadow(0 0 12px color-mix(in oklab, var(--brand) 28%, transparent));
	}

	/* view-box keeps translateY in viewBox units; without it the browser
	   resolves the transform against the element's own bounding box. */
	.descend {
		transform-box: view-box;
		transform-origin: 0 0;
		animation: descend 8.2s linear infinite;
		will-change: transform, opacity;
	}
	.paused .descend {
		animation-play-state: paused;
	}
	@keyframes descend {
		0% {
			transform: translateY(-200px);
			opacity: 0;
		}
		16% {
			opacity: 1;
		}
		84% {
			opacity: 1;
		}
		100% {
			transform: translateY(-13px);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.descend {
			animation: none;
			opacity: 1;
		}
		.descend:nth-of-type(1) {
			transform: translateY(-95px);
		}
		.descend:nth-of-type(2) {
			transform: translateY(-185px);
		}
	}
</style>
