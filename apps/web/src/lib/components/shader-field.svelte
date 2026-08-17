<script lang="ts">
import { onMount } from "svelte";
import { cn } from "$lib/utils";

// Ambient WebGL2 field: domain-warped fBm through the brand violets. Renders
// nothing and costs nothing when WebGL2 is missing, the tab is hidden, the
// element is off-screen, or the user asked for reduced motion.
type Props = { class?: string; speed?: number };
let { class: className, speed = 1 }: Props = $props();

let canvas: HTMLCanvasElement | undefined = $state();
let ready = $state(false);

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 iResolution;
uniform float iTime;
uniform float uLight;   // 0 = dark theme, 1 = light theme

const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);

// sin-free hash: steadier precision across GPUs than the fract(sin(...)) form
float hash(vec2 p) {
	p = fract(p * 0.6180339887);
	p *= 25.0;
	return fract(p.x * p.y * (p.x + p.y));
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
		f.y);
}

// Lacunarity is 2.01-2.04 rather than 2.0 so the lattice does not beat visibly.
float fbm(vec2 p) {
	float f = 0.0;
	f += 0.5000 * noise(p); p = mtx * p * 2.02;
	f += 0.2500 * noise(p); p = mtx * p * 2.03;
	f += 0.1250 * noise(p); p = mtx * p * 2.01;
	f += 0.0625 * noise(p); p = mtx * p * 2.04;
	f += 0.0312 * noise(p);
	return f / 0.9687;
}

void main() {
	vec2 R = iResolution;
	vec2 uv = (2.0 * gl_FragCoord.xy - R) / R.y;
	float t = iTime * 0.06;

	vec2 p = uv * 1.35;

	// Two-level domain warp: fbm(p + fbm(p + fbm(p)))
	vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
	vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + 0.15 * t),
	              fbm(p + 3.4 * q + vec2(8.3, 2.8) - 0.12 * t));
	float f = fbm(p + 3.0 * r);

	// Warp magnitude drives the highlight ridge; f drives the base mix.
	float ridge = clamp(length(r) * 0.85, 0.0, 1.0);
	float mixv = clamp(f * 1.15 + 0.15, 0.0, 1.0);

	vec3 deep   = vec3(0.216, 0.039, 0.498); // #370A7F
	vec3 strong = vec3(0.557, 0.341, 1.000); // #8E57FF
	vec3 light  = vec3(0.702, 0.604, 1.000); // #B39AFF
	vec3 base   = vec3(0.086, 0.090, 0.114); // #16171D

	vec3 col = mix(base, deep, smoothstep(0.05, 0.75, mixv));
	col = mix(col, strong, smoothstep(0.35, 0.95, mixv) * 0.75);
	col += light * pow(ridge, 3.0) * 0.55;

	// Light theme: same field, inverted so it reads as a pale wash on white.
	vec3 pale = mix(vec3(1.0), mix(light, strong, ridge), 0.16 + 0.20 * mixv);
	col = mix(col, pale, uLight);

	// Radial falloff so the field never collides with the section rules.
	float vig = smoothstep(1.55, 0.25, length(uv * vec2(0.78, 1.0)));
	col *= vig;

	// Ordered-ish grain. Dark violet gradients band badly without it.
	float grain = hash(gl_FragCoord.xy + fract(iTime) * 100.0) - 0.5;
	col += grain * 0.018;

	fragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
	const sh = gl.createShader(type);
	if (!sh) return null;
	gl.shaderSource(sh, src.trim());
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		console.warn("[shader-field]", gl.getShaderInfoLog(sh));
		gl.deleteShader(sh);
		return null;
	}
	return sh;
}

onMount(() => {
	if (!canvas) return;
	const gl = canvas.getContext("webgl2", {
		antialias: false,
		alpha: false,
		powerPreference: "low-power",
	});
	if (!gl) return; // no WebGL2: the CSS gradient underneath stands in

	const vs = compile(gl, gl.VERTEX_SHADER, VERT);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
	if (!vs || !fs) return;

	const prog = gl.createProgram();
	if (!prog) return;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.warn("[shader-field]", gl.getProgramInfoLog(prog));
		return;
	}
	gl.useProgram(prog);

	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 3, -1, -1, 3]),
		gl.STATIC_DRAW,
	);
	const loc = gl.getAttribLocation(prog, "aPos");
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

	const uRes = gl.getUniformLocation(prog, "iResolution");
	const uTime = gl.getUniformLocation(prog, "iTime");
	const uLight = gl.getUniformLocation(prog, "uLight");

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	let raf = 0;
	let onScreen = false;
	let t0 = performance.now();
	let elapsed = 0;

	const isLight = () => document.documentElement.dataset.theme === "light";

	const draw = (time: number) => {
		gl.uniform2f(uRes, canvas!.width, canvas!.height);
		gl.uniform1f(uTime, time);
		gl.uniform1f(uLight, isLight() ? 1 : 0);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		ready = true;
	};

	const resize = () => {
		if (!canvas) return;
		// Cap DPR at 1.5: this is an out-of-focus field, 3x costs 4x for nothing.
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
		const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
		if (canvas.width === w && canvas.height === h) return;
		canvas.width = w;
		canvas.height = h;
		gl.viewport(0, 0, w, h);
	};

	const frame = (now: number) => {
		elapsed += (now - t0) / 1000;
		t0 = now;
		resize();
		draw(elapsed);
		raf = requestAnimationFrame(frame);
	};

	const stop = () => {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	};
	const start = () => {
		if (raf || !onScreen || document.hidden) return;
		if (reduced.matches) {
			resize();
			draw(12.0); // one settled frame, no loop
			return;
		}
		t0 = performance.now();
		raf = requestAnimationFrame(frame);
	};

	const io = new IntersectionObserver(
		([e]) => {
			onScreen = e.isIntersecting;
			onScreen ? start() : stop();
		},
		{ threshold: 0.01 },
	);
	io.observe(canvas);

	const onVisibility = () => (document.hidden ? stop() : start());
	const onReduced = () => {
		stop();
		start();
	};
	// Repaint the static frame when the theme flips under reduced motion.
	const themeWatch = new MutationObserver(() => {
		if (reduced.matches && onScreen) {
			resize();
			draw(12.0);
		}
	});

	document.addEventListener("visibilitychange", onVisibility);
	reduced.addEventListener("change", onReduced);
	themeWatch.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	window.addEventListener("resize", resize);

	return () => {
		stop();
		io.disconnect();
		themeWatch.disconnect();
		document.removeEventListener("visibilitychange", onVisibility);
		reduced.removeEventListener("change", onReduced);
		window.removeEventListener("resize", resize);
		gl.getExtension("WEBGL_lose_context")?.loseContext();
	};
});
</script>

<div class={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
	<div class="fallback"></div>
	<canvas
		bind:this={canvas}
		class="h-full w-full transition-opacity duration-700 ease-out"
		style="opacity: {ready ? 1 : 0}; --speed: {speed}"
	></canvas>
</div>

<style>
	/* Shown until the first frame lands, and permanently without WebGL2. */
	.fallback {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			60% 55% at 50% 45%,
			color-mix(in oklab, var(--brand-strong) 26%, transparent),
			transparent 72%
		);
		filter: blur(48px);
		opacity: 0.5;
	}
	canvas {
		position: relative;
		display: block;
	}
</style>
