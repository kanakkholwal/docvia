<script lang="ts">
import { onMount } from "svelte";

// Ambient WebGL2 backdrop: domain-warped FBM read as slow violet aurora.
// Theme-aware via uniforms sampled from the live CSS custom properties, so it
// follows the token system instead of hard-coding a second palette.
type Props = { class?: string; intensity?: number };
let { class: className = "", intensity = 1 }: Props = $props();

let canvas: HTMLCanvasElement | undefined = $state();
let supported = $state(true);

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBg;
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uLight;     // 1.0 in light theme: the field darkens instead of glows
uniform float uIntensity;

out vec4 fragColor;

float hash(vec2 p) {
	p = fract(p * vec2(127.1, 311.7));
	p += dot(p, p + 34.5);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 5; i++) {
		v += amp * noise(p);
		p *= 2.02;
		amp *= 0.5;
	}
	return v;
}

void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

	float t = uTime * 0.045;

	// Two warp passes: the second reads the first, which is what turns plain
	// FBM into something that looks like it is flowing rather than boiling.
	vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t)), fbm(p * 1.6 + vec2(5.2, 1.3 - t)));
	vec2 r = vec2(
		fbm(p * 1.9 + 3.4 * q + vec2(1.7, 9.2) + t * 0.7),
		fbm(p * 1.9 + 3.4 * q + vec2(8.3, 2.8) - t * 0.5)
	);
	float f = fbm(p * 1.7 + 3.0 * r);

	// Ribbon the field so it reads as layered sheets, not fog.
	float band = smoothstep(0.32, 0.78, f);
	float veil = smoothstep(0.55, 0.95, f);

	vec3 tint = mix(uAccent, uAccent2, clamp(r.x * 1.4, 0.0, 1.0));

	// Broad coverage here; the element carries a radial mask that does the
	// actual edge fade. Tuning smoothstep to land on zero at a cropped canvas
	// edge is brittle, and any residue shows up as a visible rectangle.
	float dist = length((uv - 0.5) * vec2(1.0, 0.92));
	float edge = smoothstep(0.72, 0.02, dist);
	float amount = (band * 0.6 + veil * 0.4) * edge * uIntensity;

	// Dark adds the accent as light; light blends the canvas toward it. Both
	// read violet, which subtracting (1 - tint) on white did not.
	vec3 glow = uBg + tint * amount;
	vec3 wash = mix(uBg, tint, amount * 0.30);
	vec3 col = mix(glow, wash, uLight);

	// Ordered dither: 8-bit gradients on a near-black canvas band badly.
	float d = hash(gl_FragCoord.xy + fract(uTime)) - 0.5;
	col += d / 255.0;

	fragColor = vec4(col, 1.0);
}`;

function css(el: HTMLElement, name: string, fallback: [number, number, number]) {
	const raw = getComputedStyle(el).getPropertyValue(name).trim();
	const m = raw.match(/^#([0-9a-f]{6})$/i);
	if (!m) return fallback;
	const n = parseInt(m[1], 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as [
		number,
		number,
		number,
	];
}

onMount(() => {
	if (!canvas) return;
	const gl = canvas.getContext("webgl2", {
		antialias: false,
		alpha: false,
		powerPreference: "low-power",
	});
	if (!gl) {
		supported = false;
		return;
	}

	const compile = (type: number, src: string) => {
		const sh = gl.createShader(type)!;
		gl.shaderSource(sh, src.trim());
		gl.compileShader(sh);
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
			console.error(gl.getShaderInfoLog(sh));
			return null;
		}
		return sh;
	};

	const vs = compile(gl.VERTEX_SHADER, VERT);
	const fs = compile(gl.FRAGMENT_SHADER, FRAG);
	if (!vs || !fs) {
		supported = false;
		return;
	}

	const prog = gl.createProgram()!;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.bindAttribLocation(prog, 0, "aPos");
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(prog));
		supported = false;
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
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

	const u = {
		res: gl.getUniformLocation(prog, "uRes"),
		time: gl.getUniformLocation(prog, "uTime"),
		bg: gl.getUniformLocation(prog, "uBg"),
		accent: gl.getUniformLocation(prog, "uAccent"),
		accent2: gl.getUniformLocation(prog, "uAccent2"),
		light: gl.getUniformLocation(prog, "uLight"),
		intensity: gl.getUniformLocation(prog, "uIntensity"),
	};

	const root = document.documentElement;
	let theme = { bg: [0, 0, 0], a: [0, 0, 0], b: [0, 0, 0], light: 0 };
	const readTheme = () => {
		const isLight = root.dataset.theme === "light";
		theme = {
			bg: css(root, "--canvas", isLight ? [1, 1, 1] : [0.086, 0.09, 0.114]),
			a: css(root, "--brand", [0.702, 0.604, 1]),
			b: css(root, "--brand-strong", [0.557, 0.341, 1]),
			light: isLight ? 1 : 0,
		};
	};
	readTheme();

	// DPR is capped: this is a backdrop, not a texture anyone inspects.
	const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
	const resize = () => {
		const w = Math.max(1, Math.round(canvas!.clientWidth * dpr));
		const h = Math.max(1, Math.round(canvas!.clientHeight * dpr));
		if (canvas!.width === w && canvas!.height === h) return;
		canvas!.width = w;
		canvas!.height = h;
		gl.viewport(0, 0, w, h);
	};

	const draw = (tSec: number) => {
		resize();
		gl.uniform2f(u.res, canvas!.width, canvas!.height);
		gl.uniform1f(u.time, tSec);
		gl.uniform3fv(u.bg, theme.bg);
		gl.uniform3fv(u.accent, theme.a);
		gl.uniform3fv(u.accent2, theme.b);
		gl.uniform1f(u.light, theme.light);
		gl.uniform1f(u.intensity, intensity);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	let raf = 0;
	let running = false;
	let onScreen = false;
	let t0 = 0;
	let elapsed = 0;

	const frame = (now: number) => {
		if (!t0) t0 = now;
		elapsed = (now - t0) / 1000;
		draw(elapsed);
		raf = requestAnimationFrame(frame);
	};
	const start = () => {
		if (running || !onScreen || reduced.matches) return;
		running = true;
		t0 = 0;
		raf = requestAnimationFrame(frame);
	};
	const stop = () => {
		running = false;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	};

	// One static frame so reduced-motion and off-screen states still show the
	// field rather than an empty rectangle.
	draw(12);

	const io = new IntersectionObserver(
		([e]) => {
			onScreen = e.isIntersecting;
			onScreen ? start() : stop();
		},
		{ threshold: 0.01 },
	);
	io.observe(canvas);

	const ro = new ResizeObserver(() => {
		if (!running) draw(elapsed || 12);
	});
	ro.observe(canvas);

	const onTheme = () => {
		readTheme();
		if (!running) draw(elapsed || 12);
	};
	const mo = new MutationObserver(onTheme);
	mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

	const onMotion = () => (reduced.matches ? stop() : start());
	reduced.addEventListener("change", onMotion);

	const onLost = (e: Event) => {
		e.preventDefault();
		stop();
		supported = false;
	};
	canvas.addEventListener("webglcontextlost", onLost);

	return () => {
		stop();
		io.disconnect();
		ro.disconnect();
		mo.disconnect();
		reduced.removeEventListener("change", onMotion);
		canvas?.removeEventListener("webglcontextlost", onLost);
	};
});
</script>

<!-- Purely decorative; the pipeline diagram in front carries all the meaning. -->
<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="field pointer-events-none absolute inset-0 h-full w-full {className}"
	class:hidden={!supported}
></canvas>

<style>
	/* Guarantees the canvas has no visible rectangle, whatever the shader does
	   at its edges. */
	.field {
		-webkit-mask-image: radial-gradient(
			ellipse 72% 62% at 50% 46%,
			#000 30%,
			transparent 100%
		);
		mask-image: radial-gradient(
			ellipse 72% 62% at 50% 46%,
			#000 30%,
			transparent 100%
		);
	}
</style>
