import { untrack } from "svelte";
import {
	type ChartPhase,
	type ChartStatus,
	type Domain,
	LOADING_DOMAIN,
	lerpDomain,
	nextPhase,
	type SeriesConfig,
	shouldTweenDomain,
} from "./core";
import { CHART_DURATION, type Playback, tween } from "./motion";

/** Room around the reveal clip so round caps and dots at the plot edge are not cut. */
export const CLIP_PAD = 8;

/** Series registry shared by every cartesian root; order follows first registration. */
export function createSeriesRegistry(hidden: () => ReadonlySet<string>) {
	let registered = $state<SeriesConfig[]>([]);
	const series = $derived(registered.filter((s) => !hidden().has(s.key)));
	return {
		get series() {
			return series;
		},
		register(next: SeriesConfig) {
			const index = registered.findIndex((s) => s.key === next.key);
			if (index === -1) registered = [...registered, next];
			else if (registered[index]?.color !== next.color)
				registered = registered.map((s, i) => (i === index ? next : s));
			return () => {
				registered = registered.filter((s) => s.key !== next.key);
			};
		},
	};
}

/** Lifecycle: status flips conceal, retween the domain, then reveal on completion. */
export function createChartPhase(
	status: () => ChartStatus,
	animate: () => boolean,
) {
	const initial = status();
	let phase = $state<ChartPhase>(
		initial === "loading" ? "loading" : animate() ? "revealing" : "ready",
	);
	let prev = initial;
	const advance = (event: "status-ready" | "status-loading" | "done") => {
		phase = nextPhase(phase, event) ?? phase;
	};
	$effect(() => {
		const next = status();
		if (next === prev) return;
		prev = next;
		untrack(() =>
			advance(next === "ready" ? "status-ready" : "status-loading"),
		);
	});
	return {
		get phase() {
			return phase;
		},
		advance,
	};
}

/** Value domain that tweens through lifecycle phases and data changes. */
export function createAnimatedDomain(options: {
	target: () => Domain;
	phase: () => ChartPhase;
	loading: boolean;
	animate: () => boolean;
	advance: (event: "done") => void;
}) {
	let domain = $state<Domain>(
		options.loading ? LOADING_DOMAIN : options.target(),
	);
	let playback: Playback | null = null;
	const move = (to: Domain, onDone?: () => void) => {
		playback?.stop();
		const from = domain;
		if (!options.animate() || !shouldTweenDomain(from, to)) {
			domain = to;
			onDone?.();
			return;
		}
		playback = tween({
			duration: CHART_DURATION.update,
			onUpdate: (p) => {
				domain = lerpDomain(from, to, p);
			},
			onComplete: onDone,
		});
	};
	$effect(() => () => playback?.stop());
	// Only the phase change starts a lifecycle tween; target changes are handled below.
	$effect(() => {
		const phase = options.phase();
		untrack(() => {
			if (phase === "gridTweenReady")
				move(options.target(), () => options.advance("done"));
			else if (phase === "gridTweenLoading")
				move(LOADING_DOMAIN, () => options.advance("done"));
		});
	});
	$effect(() => {
		const target = options.target();
		untrack(() => {
			const phase = options.phase();
			if (phase === "ready") move(target);
			else if (phase === "revealing") {
				playback?.stop();
				domain = target;
			}
		});
	});
	return {
		get value() {
			return domain;
		},
	};
}

/** Left-to-right clip reveal and its mirrored conceal; the phase advances when the clip lands. */
export function createRevealClip(options: {
	phase: () => ChartPhase;
	innerWidth: () => number;
	animate: () => boolean;
	advance: (event: "done") => void;
}) {
	let rect = $state<SVGRectElement | null>(null);
	$effect.pre(() => {
		const phase = options.phase();
		const node = rect;
		const hasSize = options.innerWidth() > 0;
		if ((phase !== "revealing" && phase !== "concealing") || !hasSize || !node)
			return;
		const full = untrack(options.innerWidth) + CLIP_PAD * 2;
		const reveal = phase === "revealing";
		const draw = (p: number) => {
			const width = reveal ? full * p : full * (1 - p);
			node.setAttribute("width", String(width));
			node.setAttribute(
				"x",
				String(reveal ? -CLIP_PAD : -CLIP_PAD + full - width),
			);
		};
		draw(0);
		const playback = tween({
			duration: untrack(options.animate) ? CHART_DURATION.enter : 0,
			onUpdate: draw,
			onComplete: () => options.advance("done"),
		});
		return () => playback.stop();
	});
	return {
		get rect() {
			return rect;
		},
		set rect(node: SVGRectElement | null) {
			rect = node;
		},
		get width() {
			const phase = options.phase();
			const full = options.innerWidth() + CLIP_PAD * 2;
			return phase === "ready"
				? full
				: phase === "revealing" || phase === "concealing"
					? undefined
					: 0;
		},
		pad: CLIP_PAD,
	};
}
