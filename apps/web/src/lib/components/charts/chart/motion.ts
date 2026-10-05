export type Ease = (t: number) => number;

export interface SpringConfig {
	stiffness: number;
	damping: number;
	mass?: number;
}

export interface Playback {
	stop: () => void;
}

/** Solves x(t) for t by Newton-Raphson with a bisection fallback, then returns y(t). */
export function cubicBezier(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): Ease {
	const ax = 3 * x1 - 3 * x2 + 1;
	const bx = 3 * x2 - 6 * x1;
	const cx = 3 * x1;
	const ay = 3 * y1 - 3 * y2 + 1;
	const by = 3 * y2 - 6 * y1;
	const cy = 3 * y1;
	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

	return (x: number) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let t = x;
		for (let i = 0; i < 8; i++) {
			const error = sampleX(t) - x;
			if (Math.abs(error) < 1e-6) return sampleY(t);
			const slope = slopeX(t);
			if (Math.abs(slope) < 1e-6) break;
			t -= error / slope;
		}
		let lo = 0;
		let hi = 1;
		t = x;
		for (let i = 0; i < 40; i++) {
			const value = sampleX(t);
			if (Math.abs(value - x) < 1e-6) break;
			if (value < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return sampleY(t);
	};
}

/** The house curve: reveal, domain tween, path morph, axis slides. */
export const CHART_EASE = cubicBezier(0.85, 0, 0.15, 1);
export const CHART_EASE_CSS = "cubic-bezier(0.85, 0, 0.15, 1)";
/** Motion's default for a timed transition with no ease. */
export const EASE_OUT = cubicBezier(0, 0, 0.58, 1);

export const CHART_DURATION = {
	enter: 1100,
	update: 500,
	dim: 400,
	fade: 150,
} as const;

export const CHART_SPRING = {
	tooltip: { stiffness: 300, damping: 30 },
	tooltipBox: { stiffness: 100, damping: 20 },
	highlight: { stiffness: 180, damping: 28 },
	panel: { stiffness: 300, damping: 25 },
	ticker: { stiffness: 400, damping: 35 },
	pop: { stiffness: 400, damping: 25 },
} as const satisfies Record<string, SpringConfig>;

export function prefersReducedMotion(): boolean {
	return (
		typeof window !== "undefined" &&
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
	);
}

const now = () =>
	typeof performance === "undefined" ? Date.now() : performance.now();
const frame = (cb: (time: number) => void) =>
	typeof requestAnimationFrame === "undefined"
		? (setTimeout(() => cb(now()), 16) as unknown as number)
		: requestAnimationFrame(cb);
const cancelFrame = (id: number) =>
	typeof cancelAnimationFrame === "undefined"
		? clearTimeout(id)
		: cancelAnimationFrame(id);

/** Progress 0 to 1 over `duration` ms. Reduced motion or a zero duration settles synchronously. */
export function tween(options: {
	duration: number;
	ease?: Ease;
	delay?: number;
	onUpdate: (progress: number) => void;
	onComplete?: () => void;
}): Playback {
	const {
		duration,
		ease = CHART_EASE,
		delay = 0,
		onUpdate,
		onComplete,
	} = options;
	if (duration <= 0 || prefersReducedMotion()) {
		onUpdate(1);
		onComplete?.();
		return { stop: () => {} };
	}
	let id = 0;
	let stopped = false;
	const start = now() + delay;
	const step = (time: number) => {
		if (stopped) return;
		const elapsed = time - start;
		if (elapsed < 0) {
			id = frame(step);
			return;
		}
		const t = Math.min(1, elapsed / duration);
		onUpdate(ease(t));
		if (t < 1) id = frame(step);
		else onComplete?.();
	};
	id = frame(step);
	return {
		stop: () => {
			stopped = true;
			cancelFrame(id);
		},
	};
}

/** Offset from target and velocity after `t` seconds, damped harmonic oscillator, unit mass by default. */
function springState(
	d0: number,
	v0: number,
	config: SpringConfig,
	t: number,
): [number, number] {
	const mass = config.mass ?? 1;
	const w0 = Math.sqrt(config.stiffness / mass);
	const zeta = config.damping / (2 * Math.sqrt(config.stiffness * mass));
	if (zeta < 1) {
		const wd = w0 * Math.sqrt(1 - zeta * zeta);
		const decay = Math.exp(-zeta * w0 * t);
		const b = (v0 + zeta * w0 * d0) / wd;
		const cos = Math.cos(wd * t);
		const sin = Math.sin(wd * t);
		const x = decay * (d0 * cos + b * sin);
		const v =
			decay *
			((b * wd - zeta * w0 * d0) * cos - (d0 * wd + zeta * w0 * b) * sin);
		return [x, v];
	}
	if (zeta === 1) {
		const decay = Math.exp(-w0 * t);
		const b = v0 + w0 * d0;
		return [decay * (d0 + b * t), decay * (b - w0 * (d0 + b * t))];
	}
	const root = Math.sqrt(zeta * zeta - 1);
	const r1 = -w0 * (zeta - root);
	const r2 = -w0 * (zeta + root);
	const b = (v0 - r1 * d0) / (r2 - r1);
	const a = d0 - b;
	return [
		a * Math.exp(r1 * t) + b * Math.exp(r2 * t),
		a * r1 * Math.exp(r1 * t) + b * r2 * Math.exp(r2 * t),
	];
}

/** Retargetable spring. `set` keeps the current velocity, so an interrupted move stays continuous. */
export class Spring {
	private origin: number;
	private velocity = 0;
	private target: number;
	private startedAt = 0;
	private id = 0;
	private running = false;
	private current: number;
	private restSpeed = 2;
	private restDelta = 0.5;
	private config: SpringConfig;
	private onUpdate: (value: number) => void;

	constructor(
		value: number,
		config: SpringConfig,
		onUpdate: (value: number) => void,
	) {
		this.config = config;
		this.onUpdate = onUpdate;
		this.origin = value;
		this.target = value;
		this.current = value;
	}

	get value(): number {
		return this.current;
	}

	configure(config: SpringConfig) {
		this.config = config;
	}

	set(target: number) {
		if (target === this.target && this.running) return;
		if (prefersReducedMotion()) {
			this.jump(target);
			return;
		}
		if (this.running) {
			const [offset, velocity] = springState(
				this.origin - this.target,
				this.velocity,
				this.config,
				(now() - this.startedAt) / 1000,
			);
			this.origin = this.target + offset;
			this.velocity = velocity;
		} else {
			this.origin = this.current;
			this.velocity = 0;
		}
		this.target = target;
		// Motion's rest thresholds: tight for small moves, loose for large ones.
		const small = Math.abs(target - this.origin) < 5;
		this.restSpeed = small ? 0.01 : 2;
		this.restDelta = small ? 0.005 : 0.5;
		this.startedAt = now();
		if (!this.running) {
			this.running = true;
			this.id = frame(this.step);
		}
	}

	jump(value: number) {
		this.stop();
		this.origin = value;
		this.target = value;
		this.velocity = 0;
		this.current = value;
		this.onUpdate(value);
	}

	stop() {
		this.running = false;
		cancelFrame(this.id);
	}

	private step = (time: number) => {
		if (!this.running) return;
		const [offset, velocity] = springState(
			this.origin - this.target,
			this.velocity,
			this.config,
			(time - this.startedAt) / 1000,
		);
		if (
			Math.abs(velocity) <= this.restSpeed &&
			Math.abs(offset) <= this.restDelta
		) {
			this.running = false;
			this.current = this.target;
			this.onUpdate(this.target);
			return;
		}
		this.current = this.target + offset;
		this.onUpdate(this.current);
		this.id = frame(this.step);
	};
}
