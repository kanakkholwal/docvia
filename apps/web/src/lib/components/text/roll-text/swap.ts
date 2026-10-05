import { tv } from "tailwind-variants";

export const rollSwap = tv({
	base: "group/swap cursor-pointer select-none border-0 bg-transparent p-0 text-left text-inherit disabled:cursor-default",
	variants: {
		motion: {
			slide: "overflow-hidden align-bottom",
			tilt: "",
		},
	},
	defaultVariants: { motion: "slide" },
});

export const rollSwapSlide = tv({
	slots: {
		first:
			"flex flex-col transition-transform ease-[var(--ease-out)] motion-reduce:transition-none",
		second:
			"absolute top-full block transition-transform ease-[var(--ease-out)] motion-reduce:transition-none",
	},
	variants: {
		active: {
			true: { first: "-translate-y-full", second: "-translate-y-full" },
			false: {},
		},
		hover: {
			true: {
				first: "group-hover/swap:-translate-y-full",
				second: "group-hover/swap:-translate-y-full",
			},
			false: {},
		},
	},
	defaultVariants: { active: false, hover: true },
});

// Delays read --i/--n per letter: forward when turning on, reversed when turning off, so the
// exit replays the entrance backwards. --swap-lag holds the second word until the first tips.
const FIRST_ON =
	"[transform:rotateX(82deg)] opacity-0 [transition-delay:calc(var(--i)*var(--swap-stagger))]";
const SECOND_ON =
	"[transform:rotateX(0deg)] opacity-100 [transition-delay:calc(var(--i)*var(--swap-stagger)+var(--swap-lag))]";

export const rollSwapTilt = tv({
	slots: {
		stage: "inline-grid overflow-hidden align-baseline [perspective:800px]",
		layer: "col-start-1 row-start-1 inline-flex items-baseline whitespace-pre",
		char: "inline-block whitespace-pre transition-[transform,opacity] duration-[var(--swap-duration)] [backface-visibility:hidden] motion-reduce:transition-none",
	},
	variants: {
		layer: {
			first: {
				char: [
					"origin-top ease-[cubic-bezier(0.55,0,1,0.45)] [transform:rotateX(0deg)] opacity-100",
					"[transition-delay:calc((var(--n)-1-var(--i))*var(--swap-stagger)+var(--swap-lag))]",
				],
			},
			second: {
				char: [
					"origin-bottom ease-[cubic-bezier(0,0.55,0.45,1)] [transform:rotateX(-82deg)] opacity-0",
					"[transition-delay:calc((var(--n)-1-var(--i))*var(--swap-stagger))]",
				],
			},
		},
		active: { true: {}, false: {} },
		hover: { true: {}, false: {} },
	},
	compoundVariants: [
		{ layer: "first", active: true, class: { char: FIRST_ON } },
		{ layer: "second", active: true, class: { char: SECOND_ON } },
		{
			layer: "first",
			active: false,
			hover: true,
			class: {
				char: "group-hover/swap:[transform:rotateX(82deg)] group-hover/swap:opacity-0 group-hover/swap:[transition-delay:calc(var(--i)*var(--swap-stagger))]",
			},
		},
		{
			layer: "second",
			active: false,
			hover: true,
			class: {
				char: "group-hover/swap:[transform:rotateX(0deg)] group-hover/swap:opacity-100 group-hover/swap:[transition-delay:calc(var(--i)*var(--swap-stagger)+var(--swap-lag))]",
			},
		},
	],
	defaultVariants: { layer: "first", active: false, hover: true },
});

/** Letters as rendered: spaces become no-break spaces so inline-block cells keep their width. */
export function swapChars(text: string): string[] {
	return Array.from(text, (c) => (c === " " ? " " : c));
}

/** Tilt timing from `durationMs`: each letter turns in 40% of it, the second word lags 62% of a turn. */
export function tiltTiming(durationMs: number): {
	letter: number;
	lag: number;
} {
	const letter = Math.round(durationMs * 0.4);
	return { letter, lag: Math.round(letter * 0.62) };
}
