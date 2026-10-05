import type { Spring } from "./motion";

/** Jumps on first show and for keyboard moves; springs otherwise. */
export function follow(
	spring: Spring,
	target: () => number | null,
	instant: () => boolean,
) {
	let shown = false;
	$effect(() => {
		const next = target();
		const jump = instant();
		if (next === null) {
			shown = false;
			return;
		}
		if (!shown || jump) spring.jump(next);
		else spring.set(next);
		shown = true;
	});
	$effect(() => () => spring.stop());
}
