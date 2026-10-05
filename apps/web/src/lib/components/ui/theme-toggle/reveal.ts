import type { ThemeToggleStart, ThemeToggleVariant } from "./variants";

const STYLE_ID = "baby-ui-theme-toggle-reveal";

/** View Transition pseudo-elements target the document root, so this can't be scoped
 * Tailwind or a per-component motion.css class; it's injected once, globally, on mount. */
const REVEAL_CSS = `
html[data-theme-reveal="rect"]::view-transition-old(root) {
	animation: none;
	mix-blend-mode: normal;
}
html[data-theme-reveal="rect"]::view-transition-new(root) {
	mix-blend-mode: normal;
	animation: theme-reveal-rect 400ms ease-out;
}
html[data-theme-reveal="circle"]::view-transition-old(root),
html[data-theme-reveal="circle-blur"]::view-transition-old(root) {
	animation: none;
	mix-blend-mode: normal;
}
html[data-theme-reveal="circle"]::view-transition-new(root) {
	mix-blend-mode: normal;
	animation: theme-reveal-circle 700ms cubic-bezier(0.4, 0, 0.2, 1);
}
html[data-theme-reveal="circle-blur"]::view-transition-new(root) {
	mix-blend-mode: normal;
	animation: theme-reveal-circle-blur 700ms cubic-bezier(0.4, 0, 0.2, 1);
}
html[data-theme-reveal="blinds"]::view-transition-old(root) {
	animation: none;
	mix-blend-mode: normal;
}
@property --theme-reveal-slat {
	syntax: "<length>";
	inherits: false;
	initial-value: 72px;
}
html[data-theme-reveal="blinds"]::view-transition-new(root) {
	mix-blend-mode: normal;
	mask-repeat: repeat;
	mask-composite: intersect;
	animation: theme-reveal-blinds 700ms var(--ease-out);
}
html[data-theme-reveal="blinds"][data-theme-reveal-start="top-left"]::view-transition-new(root) {
	mask-image: linear-gradient(90deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px)), linear-gradient(180deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px));
	mask-size: 72px 100%, 100% 72px;
}
html[data-theme-reveal="blinds"][data-theme-reveal-start="top-right"]::view-transition-new(root) {
	mask-image: linear-gradient(270deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px)), linear-gradient(180deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px));
	mask-size: 72px 100%, 100% 72px;
}
html[data-theme-reveal="blinds"][data-theme-reveal-start="bottom-left"]::view-transition-new(root) {
	mask-image: linear-gradient(90deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px)), linear-gradient(0deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px));
	mask-size: 72px 100%, 100% 72px;
}
html[data-theme-reveal="blinds"][data-theme-reveal-start="bottom-right"]::view-transition-new(root) {
	mask-image: linear-gradient(270deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px)), linear-gradient(0deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px));
	mask-size: 72px 100%, 100% 72px;
}
html[data-theme-reveal="blinds"][data-theme-reveal-start="center"]::view-transition-new(root) {
	mask-image: linear-gradient(90deg, transparent calc(50% - var(--theme-reveal-slat) / 2 - 10px), #000 calc(50% - var(--theme-reveal-slat) / 2) calc(50% + var(--theme-reveal-slat) / 2), transparent calc(50% + var(--theme-reveal-slat) / 2 + 10px)), linear-gradient(180deg, transparent calc(50% - var(--theme-reveal-slat) / 2 - 10px), #000 calc(50% - var(--theme-reveal-slat) / 2) calc(50% + var(--theme-reveal-slat) / 2), transparent calc(50% + var(--theme-reveal-slat) / 2 + 10px));
	mask-size: 72px 100%, 100% 72px;
}
html[data-theme-reveal="blinds"][data-theme-reveal-start="bottom-up"]::view-transition-new(root) {
	mask-image: linear-gradient(0deg, #000 0 var(--theme-reveal-slat), transparent calc(var(--theme-reveal-slat) + 20px));
	mask-size: 100% 72px;
}
@keyframes theme-reveal-rect {
	from {
		clip-path: var(--theme-reveal-from, inset(100% 0 0 0));
	}
	to {
		clip-path: inset(0 0 0 0);
	}
}
@keyframes theme-reveal-circle {
	from {
		clip-path: circle(0% at var(--theme-reveal-origin, 50% 100%));
	}
	to {
		clip-path: circle(150% at var(--theme-reveal-origin, 50% 100%));
	}
}
@keyframes theme-reveal-circle-blur {
	from {
		clip-path: circle(0% at var(--theme-reveal-origin, 50% 100%));
		filter: blur(8px);
	}
	to {
		clip-path: circle(150% at var(--theme-reveal-origin, 50% 100%));
		filter: blur(0px);
	}
}
@keyframes theme-reveal-blinds {
	from {
		--theme-reveal-slat: -20px;
	}
	to {
		--theme-reveal-slat: 72px;
	}
}
`;

export const RECT_FROM: Record<ThemeToggleStart, string> = {
	"top-left": "inset(0 100% 100% 0)",
	"top-right": "inset(0 0 100% 100%)",
	"bottom-left": "inset(100% 100% 0 0)",
	"bottom-right": "inset(100% 0 0 100%)",
	center: "inset(50% 50% 50% 50%)",
	"bottom-up": "inset(100% 0 0 0)",
};

export const CIRCLE_ORIGIN: Record<ThemeToggleStart, string> = {
	"top-left": "0% 0%",
	"top-right": "100% 0%",
	"bottom-left": "0% 100%",
	"bottom-right": "100% 100%",
	center: "50% 50%",
	"bottom-up": "50% 100%",
};

export function ensureRevealStyle() {
	if (typeof document === "undefined" || document.getElementById(STYLE_ID))
		return;
	const el = document.createElement("style");
	el.id = STYLE_ID;
	el.textContent = REVEAL_CSS;
	document.head.appendChild(el);
}

type ViewTransitionDocument = Document & {
	startViewTransition(callback: () => void): {
		ready: Promise<void>;
		finished: Promise<void>;
	};
};

export function supportsViewTransition(): boolean {
	return typeof document !== "undefined" && "startViewTransition" in document;
}

export function runThemeReveal(
	variant: ThemeToggleVariant,
	start: ThemeToggleStart,
	apply: () => void,
) {
	const root = document.documentElement;

	if (variant === "rectangle") {
		root.style.setProperty("--theme-reveal-from", RECT_FROM[start]);
		root.dataset.themeReveal = "rect";
	} else if (variant === "blinds") {
		root.dataset.themeReveal = "blinds";
		root.dataset.themeRevealStart = start;
	} else {
		root.style.setProperty("--theme-reveal-origin", CIRCLE_ORIGIN[start]);
		root.dataset.themeReveal = variant;
	}

	const transition = (document as ViewTransitionDocument).startViewTransition(
		apply,
	);
	// A skipped transition (hidden tab, rapid re-toggle) rejects `ready`; the theme still applies.
	transition.ready.catch(() => {});
	transition.finished.finally(() => {
		delete root.dataset.themeReveal;
		delete root.dataset.themeRevealStart;
	});
}
