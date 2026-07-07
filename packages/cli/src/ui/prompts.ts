// The prompt library — the surface `docvia init` (and any future interactive
// command) builds its wizard from. Each prompt degrades gracefully: on a
// non-interactive stream it returns its default immediately without ever
// blocking, so scripted / CI usage keeps working unchanged.
import { c } from "../logger";
import { isInteractive, type Key, runPrompt } from "./core";
import { bar, cursor, head, S, summary } from "./theme";

const out = process.stdout;

// ── Static output (structure, not input) ──────────────────────────────────

/** Open a flow: a ┌ header that starts the rail. */
export function intro(title: string): void {
	out.write(`\n${c.green(S.barStart)}  ${title}\n${bar()}\n`);
}

/** Close a flow: a └ footer that ends the rail. */
export function outro(message: string): void {
	out.write(`${bar()}\n${c.green(S.barEnd)}  ${message}\n\n`);
}

/** Close a flow after a cancel — a red └ so aborts read clearly. */
export function cancelOutro(message = "Cancelled"): void {
	out.write(`${bar()}\n${c.red(S.barEnd)}  ${c.red(message)}\n\n`);
}

/** A boxed aside on the rail, optionally titled. */
export function note(body: string, title?: string): void {
	const lines: string[] = [bar()];
	if (title) lines.push(`${c.green(S.submit)}  ${c.bold(title)}`);
	for (const line of body.split("\n")) lines.push(bar(line));
	out.write(`${lines.join("\n")}\n`);
}

/** A single informational line on the rail. */
export function message(text: string): void {
	out.write(`${bar(text)}\n`);
}

// ── Text input ────────────────────────────────────────────────────────────

export interface TextOptions {
	message: string;
	placeholder?: string;
	/** Value used when the field is submitted empty (and for non-TTY runs). */
	defaultValue?: string;
	initialValue?: string;
	/** Return an error string to reject, or undefined to accept. */
	validate?: (value: string) => string | undefined;
}

/** Draw `value` with a reverse-video block marking the caret. */
function withCaret(value: string, pos: number, placeholder?: string): string {
	if (value === "") {
		const ph = placeholder ?? "";
		const first = ph.charAt(0) || " ";
		return c.inverse(first) + c.dim(ph.slice(1));
	}
	const at = value.charAt(pos) || " ";
	return value.slice(0, pos) + c.inverse(at) + value.slice(pos + 1);
}

export async function text(opts: TextOptions): Promise<string> {
	const fallback = opts.defaultValue ?? opts.initialValue ?? "";
	if (!isInteractive()) return fallback;

	let value = opts.initialValue ?? "";
	let caret = value.length;
	let error = "";

	const frame = (status: "active" | "submit" | "cancel"): string => {
		if (status !== "active") {
			return summary(status, opts.message, value || opts.defaultValue || "");
		}
		const lines = [
			head("active", opts.message),
			bar(withCaret(value, caret, opts.placeholder)),
		];
		lines.push(
			error ? `${c.red(S.barEnd)}  ${c.red(error)}` : c.gray(S.barEnd),
		);
		return lines.join("\n");
	};

	await runPrompt({
		frame,
		onKey: (key: Key, ctx) => {
			if (key.name === "return") {
				if (value === "" && opts.defaultValue !== undefined) {
					value = opts.defaultValue;
				}
				const err = opts.validate?.(value);
				if (err) {
					error = err;
					return;
				}
				ctx.submit();
				return;
			}
			error = "";
			if (key.name === "backspace") {
				if (caret > 0) {
					value = value.slice(0, caret - 1) + value.slice(caret);
					caret--;
				}
				return;
			}
			if (key.name === "left") {
				caret = Math.max(0, caret - 1);
				return;
			}
			if (key.name === "right") {
				caret = Math.min(value.length, caret + 1);
				return;
			}
			if (key.name === "home") {
				caret = 0;
				return;
			}
			if (key.name === "end") {
				caret = value.length;
				return;
			}
			// Accept a single printable character.
			const ch = key.sequence;
			if (ch && ch.length === 1 && ch >= " " && !key.ctrl && !key.meta) {
				value = value.slice(0, caret) + ch + value.slice(caret);
				caret++;
			}
		},
	});

	return value || opts.defaultValue || "";
}

// ── Single select ─────────────────────────────────────────────────────────

export interface SelectOption<T> {
	value: T;
	label: string;
	hint?: string;
}

export interface SelectOptions<T> {
	message: string;
	options: Array<SelectOption<T>>;
	initialValue?: T;
}

export async function select<T>(opts: SelectOptions<T>): Promise<T> {
	const first = opts.options[0];
	if (!first) throw new Error("select requires at least one option");

	const startIndex = Math.max(
		0,
		opts.options.findIndex((o) => o.value === opts.initialValue),
	);
	if (!isInteractive()) return (opts.options[startIndex] ?? first).value;

	let index = startIndex;
	const frame = (status: "active" | "submit" | "cancel"): string => {
		const chosen = opts.options[index] ?? first;
		if (status !== "active") {
			return summary(status, opts.message, chosen.label);
		}
		const lines = [head("active", opts.message)];
		opts.options.forEach((o, i) => {
			const on = i === index;
			const dot = on ? c.green(S.radioOn) : c.gray(S.radioOff);
			const label = on ? c.white(o.label) : c.dim(o.label);
			const hint = on && o.hint ? c.dim(`  ${o.hint}`) : "";
			lines.push(bar(`${dot} ${label}${hint}`));
		});
		lines.push(c.gray(S.barEnd));
		return lines.join("\n");
	};

	await runPrompt({
		frame,
		onKey: (key, ctx) => {
			const n = opts.options.length;
			if (key.name === "up" || key.name === "k") index = (index - 1 + n) % n;
			else if (key.name === "down" || key.name === "j") index = (index + 1) % n;
			else if (key.name === "return") ctx.submit();
		},
	});

	return (opts.options[index] ?? first).value;
}

// ── Multi select ──────────────────────────────────────────────────────────

export interface MultiSelectOptions<T> {
	message: string;
	options: Array<SelectOption<T>>;
	initialValues?: T[];
	/** Require at least one selection before submit is allowed. */
	required?: boolean;
}

export async function multiselect<T>(
	opts: MultiSelectOptions<T>,
): Promise<T[]> {
	const initial = new Set<number>();
	opts.options.forEach((o, i) => {
		if (opts.initialValues?.includes(o.value)) initial.add(i);
	});
	const valuesAt = (indices: Iterable<number>): T[] =>
		[...indices]
			.sort((a, b) => a - b)
			.flatMap((i) => {
				const o = opts.options[i];
				return o ? [o.value] : [];
			});

	if (!isInteractive()) return valuesAt(initial);

	let cursorIndex = 0;
	const selected = initial;
	let error = "";

	const chosenLabels = (): string =>
		opts.options
			.filter((_, i) => selected.has(i))
			.map((o) => o.label)
			.join(", ") || "none";

	const frame = (status: "active" | "submit" | "cancel"): string => {
		if (status !== "active") {
			return summary(status, opts.message, chosenLabels());
		}
		const lines = [
			`${head("active", opts.message)}  ${c.dim("(space to toggle, a for all)")}`,
		];
		opts.options.forEach((o, i) => {
			const on = i === cursorIndex;
			const box = selected.has(i)
				? c.green(S.checkOn)
				: on
					? c.white(S.checkOff)
					: c.gray(S.checkOff);
			const label = on
				? c.white(o.label)
				: selected.has(i)
					? o.label
					: c.dim(o.label);
			const hint = on && o.hint ? c.dim(`  ${o.hint}`) : "";
			lines.push(bar(`${box} ${label}${hint}`));
		});
		lines.push(
			error ? `${c.red(S.barEnd)}  ${c.red(error)}` : c.gray(S.barEnd),
		);
		return lines.join("\n");
	};

	await runPrompt({
		frame,
		onKey: (key, ctx) => {
			const n = opts.options.length;
			if (key.name === "up" || key.name === "k") {
				cursorIndex = (cursorIndex - 1 + n) % n;
			} else if (key.name === "down" || key.name === "j") {
				cursorIndex = (cursorIndex + 1) % n;
			} else if (key.name === "space") {
				error = "";
				if (selected.has(cursorIndex)) selected.delete(cursorIndex);
				else selected.add(cursorIndex);
			} else if (key.name === "a") {
				error = "";
				if (selected.size === n) selected.clear();
				else for (let i = 0; i < n; i++) selected.add(i);
			} else if (key.name === "return") {
				if (opts.required && selected.size === 0) {
					error = "Select at least one option.";
					return;
				}
				ctx.submit();
			}
		},
	});

	return valuesAt(selected);
}

// ── Confirm ───────────────────────────────────────────────────────────────

export interface ConfirmOptions {
	message: string;
	initialValue?: boolean;
}

export async function confirm(opts: ConfirmOptions): Promise<boolean> {
	const fallback = opts.initialValue ?? true;
	if (!isInteractive()) return fallback;

	let value = fallback;
	const frame = (status: "active" | "submit" | "cancel"): string => {
		if (status !== "active") {
			return summary(status, opts.message, value ? "Yes" : "No");
		}
		const yes = value
			? `${c.green(S.radioOn)} ${c.white("Yes")}`
			: `${c.gray(S.radioOff)} ${c.dim("Yes")}`;
		const no = !value
			? `${c.green(S.radioOn)} ${c.white("No")}`
			: `${c.gray(S.radioOff)} ${c.dim("No")}`;
		return [
			head("active", opts.message),
			bar(`${yes}   ${no}`),
			c.gray(S.barEnd),
		].join("\n");
	};

	await runPrompt({
		frame,
		onKey: (key, ctx) => {
			if (
				key.name === "left" ||
				key.name === "right" ||
				key.name === "h" ||
				key.name === "l" ||
				key.name === "tab"
			) {
				value = !value;
			} else if (key.name === "y") value = true;
			else if (key.name === "n") value = false;
			else if (key.name === "return") ctx.submit();
		},
	});

	return value;
}

// ── Spinner ───────────────────────────────────────────────────────────────

export interface Spinner {
	start(message: string): void;
	update(message: string): void;
	stop(message?: string, ok?: boolean): void;
}

/**
 * A single-line spinner for async work. Non-interactive streams get plain
 * before/after log lines instead of animation.
 */
export function spinner(): Spinner {
	const frames = S.spinner;
	let timer: ReturnType<typeof setInterval> | null = null;
	let frame = 0;
	let label = "";
	const interactive = isInteractive();

	return {
		start(msg) {
			label = msg;
			if (!interactive) {
				out.write(`${bar(label)}\n`);
				return;
			}
			out.write(cursor.hide);
			timer = setInterval(() => {
				frame = (frame + 1) % frames.length;
				out.write(`\r${c.cyan(frames[frame] ?? "")}  ${label}\x1b[0K`);
			}, 80);
		},
		update(msg) {
			label = msg;
		},
		stop(msg, ok = true) {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
			const final = msg ?? label;
			if (!interactive) {
				if (msg) out.write(`${bar(final)}\n`);
				return;
			}
			const glyph = ok ? c.green(S.submit) : c.red(S.cancel);
			out.write(`\r${glyph}  ${final}\x1b[0K\n${bar()}\n`);
			out.write(cursor.show);
		},
	};
}
