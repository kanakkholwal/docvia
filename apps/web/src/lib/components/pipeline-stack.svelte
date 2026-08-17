<script lang="ts">
import { onMount } from "svelte";
import LogoMark from "./logo-mark.svelte";
import ShaderField from "./shader-field.svelte";

// Isometric projection: (x, y, z) -> (cx + (x-y)·cos30, cy + (x+y)·sin30 - z).
// An SVG matrix reproduces it exactly, so every plane stays a plain <rect rx>
// and the corner rounding shears correctly instead of being faked with paths.
const S = 84; // plane half-size
const CX = 200;
const CY = 268;
const iso = (z: number) => `matrix(0.866 0.5 -0.866 0.5 ${CX} ${CY - z})`;

// Slabs are two stacked rects: a violet one at z, a face at z + THICK. The
// violet rim peeking out below is the extrusion, which is what gives the base
// weight instead of reading as another outline.
const THICK = 11;

// Compiler stages, not file extensions. The extensions are the boring half of
// the story; what a build tool sells is the work between them.
const stages = [
	{ label: "PARSE", phase: "0s" },
	{ label: "TRANSFORM", phase: "-3s" },
	{ label: "CACHE", phase: "-6s" },
];

// Emitted targets fan out below the base, clear of its footprint.
const CHIP = 20;
const CHIP_T = 6;
const emits = [
	{ label: "REACT", cx: 72, cy: 356, dx: -46, dy: 20 },
	{ label: "SVELTE", cx: 200, cy: 400, dx: 0, dy: 52 },
	{ label: "HTML", cx: 328, cy: 356, dx: 46, dy: 20 },
];

let root: HTMLElement | undefined = $state();
let entered = $state(false); // entrance choreography has been triggered
let looping = $state(false); // descent loop released once the pieces land

onMount(() => {
	if (!root) return;
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let t: ReturnType<typeof setTimeout>;

	const io = new IntersectionObserver(
		([e]) => {
			if (!e.isIntersecting) {
				looping = false; // never animate off-screen
				return;
			}
			entered = true;
			if (reduced) return;
			t = setTimeout(() => (looping = true), 1150);
		},
		{ threshold: 0.25 },
	);
	io.observe(root);
	return () => {
		clearTimeout(t);
		io.disconnect();
	};
});
</script>

<div
	bind:this={root}
	class="relative isolate w-full overflow-hidden"
	class:entered
	class:looping
>
	<ShaderField intensity={1.15} />

	<!-- Watermark, not part of the diagram. Kept out of the SVG so the mark
	     renders at its own scale instead of inheriting the outer viewBox. -->
	<div
		class="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 text-muted"
		aria-hidden="true"
	>
		<LogoMark class="h-4 w-4" accent={false} />
		<span class="font-display text-[13px] font-medium tracking-tight">docvia</span>
	</div>

	<div class="stage-wrap">
	<div class="stage">
	<svg
		viewBox="0 0 400 434"
		class="relative mx-auto w-full max-w-140"
		role="img"
		aria-labelledby="pipeline-title pipeline-desc"
	>
		<title id="pipeline-title">The docvia compile pipeline</title>
		<desc id="pipeline-desc">
			Parse, transform and cache stages resolve onto the docvia compiler, which
			emits React, Svelte and static HTML.
		</desc>

		<!-- Connectors run first so the visible part is only what clears the base. -->
		<g class="wires" stroke="var(--hairline-strong)" stroke-width="1">
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
				rx="20"
				transform={iso(0)}
				class="slab-side"
			/>
			<g transform={iso(THICK)}>
				<rect x={-S} y={-S} width={S * 2} height={S * 2} rx="20" class="slab-face" />
				<text x="0" y={S * 0.66} text-anchor="middle" class="plane-label base-label">
					COMPILE
				</text>
			</g>
		</g>

		<!-- Stage layers, outline only so they read as glass. The CSS transform
		     sits on an outer group so it composes with the iso matrix rather
		     than overwriting it. -->
		{#each stages as s}
			<g class="descend" style="--phase: {s.phase}">
				<g transform={iso(0)}>
					<rect x={-S} y={-S} width={S * 2} height={S * 2} rx="20" class="plane-float" />
					<text x="0" y={S * 0.66} text-anchor="middle" class="plane-label float">
						{s.label}
					</text>
				</g>
			</g>
		{/each}

		<!-- Emitted targets, same extrusion at chip scale. -->
		{#each emits as e, i}
			<g class="chip" style="--dx: {e.dx}px; --dy: {e.dy}px; --i: {i}">
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
					<rect x={-CHIP} y={-CHIP} width={CHIP * 2} height={CHIP * 2} rx="7" class="slab-face" />
					<text x="0" y={CHIP * 0.58} text-anchor="middle" class="chip-label">
						{e.label}
					</text>
				</g>
			</g>
		{/each}
	</svg>
	</div>
	</div>
</div>

<style>
	/* Every animated group measures its transform against the viewBox; without
	   this the browser resolves translate against the element's own bbox. */
	.base,
	.chip,
	.descend,
	.wires {
		transform-box: view-box;
		transform-origin: 0 0;
	}
	/* Anything that scales pivots on the plane centre (CX, CY). */
	.base,
	.descend {
		transform-origin: 200px 268px;
	}

	.slab-side {
		fill: var(--brand-strong);
	}
	.slab-face {
		fill: var(--surface-card);
		stroke: var(--brand);
		stroke-width: 1.25;
	}
	.plane-float {
		fill: none;
		stroke: var(--hairline-strong);
		stroke-width: 1.25;
	}

	/* Labels live inside the iso group, so they shear with the plane. That skew
	   is the look, not a bug. */
	.plane-label {
		fill: var(--muted);
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.16em;
	}
	.base-label {
		fill: var(--ink);
	}
	.chip-label {
		fill: var(--body);
		font-family: var(--font-mono);
		font-size: 7.5px;
		font-weight: 500;
		letter-spacing: 0.1em;
	}

	.base .slab-face {
		filter: drop-shadow(0 0 14px color-mix(in oklab, var(--brand) 26%, transparent));
	}

	/* ── Entrance ──
	   Nothing is visible until the observer fires, so the assembly always plays
	   from the start rather than half-finished above the fold. */
	.base,
	.chip,
	.wires,
	.descend {
		opacity: 0;
	}

	.entered .base {
		animation: rise 0.85s var(--ease-out) both;
	}
	.entered .wires {
		animation: fade 0.6s 0.75s linear both;
	}
	.entered .chip {
		animation: assemble 0.7s var(--ease-out) both;
		animation-delay: calc(0.42s + var(--i) * 0.1s);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(34px) scale(0.94);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	/* Each chip flies in from the direction it will settle toward. */
	@keyframes assemble {
		from {
			opacity: 0;
			transform: translate(calc(var(--dx) * 2.4), calc(var(--dy) * 2.4));
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* ── Loop ── released once the base has landed. */
	.entered .descend {
		animation: descend 9s linear infinite;
		animation-delay: var(--phase);
		will-change: transform, opacity;
	}
	.entered:not(.looping) .descend,
	.entered:not(.looping) .stage {
		animation-play-state: paused;
	}
	/* A layer resolves before it lands: it appears small at the top, drops a
	   little at that size, then grows to full while it keeps falling. */
	@keyframes descend {
		0% {
			transform: translateY(-196px) scale(0.5);
			opacity: 0;
		}
		7% {
			transform: translateY(-188px) scale(0.5);
			opacity: 1;
		}
		19% {
			transform: translateY(-169px) scale(0.54);
			opacity: 1;
		}
		42% {
			transform: translateY(-124px) scale(1);
			opacity: 1;
		}
		84% {
			transform: translateY(-32px) scale(1);
			opacity: 1;
		}
		100% {
			transform: translateY(-11px) scale(1);
			opacity: 0;
		}
	}

	/* Camera drift. Long holds with a ~1.6s move between them, so the view
	   re-angles occasionally instead of orbiting continuously. */
	.stage-wrap {
		perspective: 1400px;
	}
	.entered .stage {
		animation: orbit 20s var(--ease-in-out) infinite;
	}
	@keyframes orbit {
		0%,
		42% {
			transform: rotateY(-6deg) rotateX(1.2deg);
		}
		50%,
		92% {
			transform: rotateY(6deg) rotateX(-1.2deg);
		}
		100% {
			transform: rotateY(-6deg) rotateX(1.2deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.entered .base,
		.entered .chip,
		.entered .wires {
			animation: none;
			opacity: 1;
			transform: none;
		}
		.entered .stage {
			animation: none;
			transform: none;
		}
		/* Static exploded stack instead of a descent. */
		.entered .descend {
			opacity: 1;
			animation: none;
		}
		.entered .descend:nth-of-type(1) {
			transform: translateY(-58px);
		}
		.entered .descend:nth-of-type(2) {
			transform: translateY(-116px);
		}
		.entered .descend:nth-of-type(3) {
			transform: translateY(-174px);
		}
	}
</style>
