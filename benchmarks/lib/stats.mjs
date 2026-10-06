/** Median, min and raw samples, rounded to whole milliseconds. */
export function summarize(samples) {
	const sorted = [...samples].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
	return {
		median: Math.round(median),
		min: Math.round(sorted[0]),
		samples: samples.map(Math.round),
	};
}

export function formatMs(ms) {
	if (ms === undefined) return "n/a";
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function formatKB(bytes) {
	return bytes === undefined ? "n/a" : `${(bytes / 1024).toFixed(1)} KB`;
}
