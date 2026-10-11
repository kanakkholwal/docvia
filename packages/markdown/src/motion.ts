export type Effect = "fade" | "blur" | "rise" | "settle" | "wipe";

export interface AnimateOptions {
	/** How new words enter, or the name of your own `@keyframes`. Default "fade". */
	effect?: Effect | (string & {});
	/** Milliseconds for a word to enter. Default 240. */
	duration?: number;
	/** Delay between consecutive new words, capped at 400ms per update. Default 18. */
	stagger?: number;
	/** CSS easing for the enter animation. Default "ease-out". */
	easing?: string;
	/** Glide words that move when a line rewraps; a number sets the milliseconds. Default 180. */
	layout?: boolean | number;
}

const BUILT_IN = new Set(["fade", "blur", "rise", "settle", "wipe"]);

/** CSS custom properties for a streaming container; spread into a `style`. */
export function motionStyle(
	options: AnimateOptions = {},
): Record<string, string> {
	const effect = options.effect ?? "fade";
	return {
		"--md-effect": BUILT_IN.has(effect) ? `md-${effect}` : effect,
		"--md-duration": `${options.duration ?? 240}ms`,
		"--md-easing": options.easing ?? "ease-out",
	};
}

export interface Motion {
	/** Call after each DOM update: staggers new words, glides moved ones, places the caret. */
	update(final: boolean, animate: AnimateOptions | null, caret?: boolean): void;
	reset(): void;
}

// Only the last words can move on a rewrap; measuring all of a long answer would cost a layout pass each chunk.
const TAIL = 400;

const NESTS = /^(?:P|UL|OL|LI|BLOCKQUOTE|DIV|TABLE|TBODY|TR|TD|TH|H[1-6])$/;

// The innermost block holding the last text, so the caret sits after the last word, not below a list.
function caretTarget(root: Element): Element | null {
	let el: Element | null = root;
	for (;;) {
		let last = el.lastChild;
		while (last?.nodeType === 3 && !last.textContent?.trim())
			last = last.previousSibling;
		if (last?.nodeType !== 1) return el === root ? null : el;
		const child = last as HTMLElement;
		if (child.style.display !== "contents" && !NESTS.test(child.tagName))
			return el === root ? child : el;
		el = child;
	}
}

/** Drives word stagger, layout motion and the caret for a root that renders `[data-md-word]` spans. */
export function createMotion(root: Element): Motion {
	let seen = 0;
	let positions = new Map<number, { x: number; y: number }>();
	const glides = new WeakMap<HTMLElement, Animation>();
	const reduced = () =>
		root.ownerDocument.defaultView?.matchMedia?.(
			"(prefers-reduced-motion: reduce)",
		).matches === true;

	return {
		update(final, animate, caret = true) {
			for (const old of root.querySelectorAll("[data-md-caret]"))
				old.removeAttribute("data-md-caret");
			if (caret && !final) caretTarget(root)?.setAttribute("data-md-caret", "");
			if (!animate) return;
			const words = root.querySelectorAll<HTMLElement>("[data-md-word]");
			const stagger = animate.stagger ?? 18;
			seen = Math.min(seen, words.length);
			for (let i = seen; i < words.length; i++)
				(words[i] as HTMLElement).style.animationDelay =
					`${Math.min((i - seen) * stagger, 400)}ms`;
			seen = words.length;
			const layout = animate.layout ?? true;
			if (layout === false || reduced()) return;
			const duration = layout === true ? 180 : layout;
			// A `display: contents` root has no box; measure against its parent so scrolling isn't motion.
			let origin = root.getBoundingClientRect();
			if (!origin.width && !origin.height && root.parentElement)
				origin = root.parentElement.getBoundingClientRect();
			const next = new Map<number, { x: number; y: number }>();
			const view = root.ownerDocument.defaultView;
			for (let i = Math.max(0, words.length - TAIL); i < words.length; i++) {
				const word = words[i] as HTMLElement;
				const rect = word.getBoundingClientRect();
				// Enter effects and running glides offset `left`/`top`; strip them to get the resting spot.
				const style = view?.getComputedStyle(word);
				const dx = Number.parseFloat(style?.left ?? "") || 0;
				const dy = Number.parseFloat(style?.top ?? "") || 0;
				const at = {
					x: rect.left - origin.left - dx,
					y: rect.top - origin.top - dy,
				};
				next.set(i, at);
				const was = positions.get(i);
				if (!was || (Math.abs(was.x - at.x) < 1 && Math.abs(was.y - at.y) < 1))
					continue;
				glides.get(word)?.cancel();
				// Start from where the word is drawn now, so an interrupted glide doesn't jump.
				glides.set(
					word,
					word.animate(
						[
							{ left: `${was.x - at.x + dx}px`, top: `${was.y - at.y + dy}px` },
							{ left: "0px", top: "0px" },
						],
						{ duration, easing: "cubic-bezier(.2,.8,.2,1)" },
					),
				);
			}
			positions = next;
		},
		reset() {
			seen = 0;
			positions = new Map();
		},
	};
}
