// Same goal as Streamdown's remend: make a half-written Markdown tail render as it will once complete.

/** Closes or hides constructs a stream cut off mid-way, in the text after the last blank line. */
export function repair(tail: string): string {
	let text = tail;
	// Inside an open code fence everything is literal; the parser already renders it as code.
	const fences = text.match(/^ {0,3}(?:`{3,}|~{3,})/gm)?.length ?? 0;
	if (fences % 2 === 1) return text;

	const lines = text.split("\n");
	const last = lines.at(-1) ?? "";
	// A table appears once its delimiter row is complete; until then hide the header and partial row.
	const isRow = (l: string | undefined) => /^\s*\|/.test(l ?? "");
	if (isRow(last) && !isRow(lines.at(-2))) lines.splice(-1, 1);
	else if (
		/^\s*\|?[\s:|-]*-[\s:|-]*$/.test(last) &&
		isRow(lines.at(-2)) &&
		!isRow(lines.at(-3))
	)
		lines.splice(-2, 2);
	text = lines.join("\n");

	text = text
		.replace(/\\$/, "")
		.replace(/&[#a-zA-Z0-9]*$/, "")
		.replace(/!\[[^\]]*(?:\]\([^)]*)?$/, "")
		.replace(/\[([^\]]*)\]\([^)]*$/, "$1")
		.replace(/\[([^\]]*)$/, "$1");

	// Code spans first: markers inside them are not emphasis.
	const ticks = text.match(/`+/g) ?? [];
	const openTick = ticks.length % 2 === 1 ? (ticks.at(-1) as string) : "";
	const scan = openTick ? text : text.replace(/`[^`]*`/g, "");
	const closers: string[] = [];
	const count = (re: RegExp) => scan.match(re)?.length ?? 0;
	if (count(/\*\*/g) % 2 === 1) closers.push("**");
	if (count(/(?<![\w_])__|__(?![\w_])/g) % 2 === 1) closers.push("__");
	if (count(/~~/g) % 2 === 1) closers.push("~~");
	// Single markers, ignoring doubles, list bullets and underscores inside words.
	const singleStar =
		scan
			.replace(/\*\*/g, "")
			.replace(/^\s*\* /gm, "")
			.match(/\*/g)?.length ?? 0;
	if (singleStar % 2 === 1) closers.push("*");
	const singleUnderscore =
		scan.replace(/__/g, "").match(/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu)
			?.length ?? 0;
	if (singleUnderscore % 2 === 1) closers.push("_");
	if (openTick) return `${text}${openTick}`;
	// Innermost marker closes first: `**bold *it` becomes `**bold *it***`.
	return closers.length > 0
		? `${text.replace(/\s+$/, "")}${closers.reverse().join("")}`
		: text;
}
