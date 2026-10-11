import type { Block } from "./ast";
import { createParseContext, type ParseOptions, parse } from "./block";
import { repair } from "./repair";

export interface StreamBlock {
	/** Stable from the block's first appearance to the end of the stream. */
	key: string;
	node: Block;
	/** Final: later chunks cannot change it. */
	done: boolean;
}

export interface StreamOptions extends Omit<ParseOptions, "context"> {
	/** Close half-written emphasis, code and links in the live tail. Default true. */
	repair?: boolean;
}

export interface MarkdownStream {
	/** Appends a chunk and returns every block so far. */
	push(chunk: string): StreamBlock[];
	/** Marks the stream complete: the tail is parsed as written, without repair. */
	end(): StreamBlock[];
	readonly blocks: StreamBlock[];
	readonly source: string;
}

// A line that would continue the block above a blank line: indented, a list item, a quote or a table row.
const CONTINUES = /^(?:[ \t]|[*+-][ \t]|\d{1,9}[.)][ \t]|>|\|)/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Parses Markdown as it arrives. Finished blocks are parsed once and frozen; only the tail after
 * the last safe boundary is parsed again on each chunk, so a long answer stays cheap.
 */
export function createMarkdownStream(
	options: StreamOptions = {},
): MarkdownStream {
	const context = createParseContext();
	const parseOptions: ParseOptions = { ...options, context };
	let source = "";
	let committed = 0;
	let scanned = 0;
	let fence: string | null = null;
	let sawBlank = false;
	const frozen: StreamBlock[] = [];
	let blocks: StreamBlock[] = [];

	// Advances over complete lines, freezing everything before a line that starts a fresh block.
	function commit() {
		let boundary = -1;
		while (true) {
			const nl = source.indexOf("\n", scanned);
			if (nl === -1) break;
			const line = source.slice(scanned, nl);
			const fenceMatch = FENCE.exec(line);
			if (fence) {
				if (
					fenceMatch &&
					(fenceMatch[1] as string)[0] === fence[0] &&
					(fenceMatch[1] as string).length >= fence.length &&
					/^\s*(?:`+|~+)\s*$/.test(line)
				)
					fence = null;
			} else if (/^\s*$/.test(line)) {
				sawBlank = true;
			} else {
				if (sawBlank && !CONTINUES.test(line)) boundary = scanned;
				sawBlank = false;
				if (fenceMatch) fence = fenceMatch[1] as string;
			}
			scanned = nl + 1;
		}
		if (boundary > committed) {
			for (const node of parse(source.slice(committed, boundary), parseOptions)
				.children)
				frozen.push({ key: `b${frozen.length}`, node, done: true });
			committed = boundary;
		}
	}

	function render(final: boolean): StreamBlock[] {
		// A reference link can be defined after its use, so a finished stream that has definitions parses once more.
		if (final && /^ {0,3}\[[^\]]+\]:/m.test(source)) {
			blocks = parse(source, options).children.map((node, i) => ({
				key: `b${i}`,
				node,
				done: true,
			}));
			return blocks;
		}
		const raw = source.slice(committed);
		const tail = final || options.repair === false ? raw : repair(raw);
		// The tail is re-parsed each time, so its link definitions and heading ids must not stick.
		const scratch = { refs: new Map(context.refs), ids: new Map(context.ids) };
		const live = parse(tail, {
			...options,
			context: final ? context : scratch,
		}).children;
		blocks = [
			...frozen,
			...live.map((node, i) => ({
				key: `b${frozen.length + i}`,
				node,
				done: final,
			})),
		];
		return blocks;
	}

	return {
		push(chunk) {
			source += chunk;
			commit();
			return render(false);
		},
		end() {
			return render(true);
		},
		get blocks() {
			return blocks;
		},
		get source() {
			return source;
		},
	};
}
