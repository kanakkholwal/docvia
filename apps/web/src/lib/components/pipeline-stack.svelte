<script lang="ts">
import ShaderField from "./shader-field.svelte";

// Isometric projection: (x, y, z) -> (cx + (x-y)·cos30, cy + (x+y)·sin30 - z).
// An SVG matrix reproduces it exactly, so every plane stays a plain <rect rx>
// and the corner rounding shears correctly instead of being faked with paths.
const S = 96; // plane half-size
const CX = 200;
const CY = 300;
const iso = (z: number) => `matrix(0.866 0.5 -0.866 0.5 ${CX} ${CY - z})`;

// Source layers fall onto the base and are absorbed. Two of them, half a cycle
// apart, so one is always mid-descent.
const falling = [
	{ label: ".md", delay: "0s" },
	{ label: ".mdx", delay: "-3.4s" },
];

// Emitted targets, hanging off the base. Screen-space so they stay in frame.
const CHIP = 20;
const emits = [
	{ label: ".tsx", cx: 52, cy: 366 },
	{ label: ".html", cx: 348, cy: 366 },
	{ label: ".svelte", cx: 200, cy: 424 },
];
</script>

<div class="relative isolate w-full overflow-hidden">
	<ShaderField intensity={1} />

	<svg
		viewBox="0 0 400 470"
		class="relative mx-auto w-full max-w-[440px]"
		role="img"
		aria-labelledby="pipeline-title pipeline-desc"
	>
		<title id="pipeline-title">The docvia compile pipeline</title>
		<desc id="pipeline-desc">
			Markdown and MDX source layers descend onto the docvia compiler, which
			emits React, Svelte and static HTML.
		</desc>

		<!-- Emit lines run under everything so the chips read as attached. -->
		<g stroke="var(--hairline-strong)" stroke-width="1" opacity="0.7">
			{#each emits as e}
				<line x1={CX} y1={CY} x2={e.cx} y2={e.cy} />
			{/each}
		</g>

		<!-- Base: the compiler. Everything else resolves into this. -->
		<g class="base" transform={iso(0)}>
			<rect x={-S} y={-S} width={S * 2} height={S * 2} rx="22" class="plane-base" />
			<text x="0" y="6" text-anchor="middle" class="plane-label">.docvia</text>
		</g>

		<!-- Falling source layers. The CSS transform is on an outer group so it
		     composes with the iso matrix instead of overwriting it. -->
		{#each falling as f}
			<g class="descend" style="animation-delay: {f.delay}">
				<g transform={iso(0)}>
					<rect
						x={-S}
						y={-S}
						width={S * 2}
						height={S * 2}
						rx="22"
						class="plane-float"
					/>
					<text x="0" y="6" text-anchor="middle" class="plane-label float">
						{f.label}
					</text>
				</g>
			</g>
		{/each}

		<!-- Target chips. -->
		{#each emits as e}
			<g class="chip">
				<rect
					x={-CHIP}
					y={-CHIP}
					width={CHIP * 2}
					height={CHIP * 2}
					rx="7"
					transform={`matrix(0.866 0.5 -0.866 0.5 ${e.cx} ${e.cy})`}
					class="chip-face"
				/>
				<text x={e.cx} y={e.cy + 3} text-anchor="middle" class="chip-label">
					{e.label}
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.plane-base {
		fill: color-mix(in oklab, var(--surface-card) 92%, transparent);
		stroke: var(--brand);
		stroke-width: 1.5;
		filter: drop-shadow(0 0 10px color-mix(in oklab, var(--brand) 30%, transparent));
	}
	.plane-float {
		fill: color-mix(in oklab, var(--surface-soft) 55%, transparent);
		stroke: var(--hairline-strong);
		stroke-width: 1.25;
	}

	.plane-label {
		fill: var(--ink);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 500;
		letter-spacing: 0.04em;
	}
	.plane-label.float {
		fill: var(--muted);
	}

	.chip-face {
		fill: color-mix(in oklab, var(--surface-card) 94%, transparent);
		stroke: var(--hairline);
		stroke-width: 1.25;
	}
	.chip-label {
		fill: var(--body);
		font-family: var(--font-mono);
		font-size: 9px;
	}

	/* view-box keeps translateY in viewBox units; without it the browser
	   resolves the transform against the element's own bounding box. */
	.descend {
		transform-box: view-box;
		transform-origin: 0 0;
		animation: descend 6.8s linear infinite;
		will-change: transform, opacity;
	}
	@keyframes descend {
		0% {
			transform: translateY(-215px);
			opacity: 0;
		}
		14% {
			opacity: 1;
		}
		82% {
			opacity: 1;
		}
		100% {
			transform: translateY(0);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.descend {
			animation: none;
			transform: translateY(-120px);
			opacity: 0.85;
		}
		.descend:last-of-type {
			display: none;
		}
	}
</style>
