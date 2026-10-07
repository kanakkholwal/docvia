/**
 * Median, min and p95 of the samples that finished, rounded to whole ms. `null` samples timed out;
 * `missed` counts them, and the statistics are `null` when none finished.
 */
export function summarize(samples) {
	const done = samples.filter((s) => s !== null).sort((a, b) => a - b);
	const missed = samples.length - done.length;
	if (done.length === 0) {
		return { median: null, min: null, p95: null, missed, samples };
	}
	const mid = Math.floor(done.length / 2);
	const median =
		done.length % 2 === 0 ? (done[mid - 1] + done[mid]) / 2 : done[mid];
	return {
		median: Math.round(median),
		min: Math.round(done[0]),
		p95: Math.round(done[Math.ceil(done.length * 0.95) - 1]),
		missed,
		samples: samples.map((s) => (s === null ? null : Math.round(s))),
	};
}

export function formatMs(ms) {
	if (ms === undefined) return "n/a";
	if (ms === null) return "not seen";
	return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function formatKB(bytes) {
	return bytes === undefined ? "n/a" : `${(bytes / 1024).toFixed(1)} KB`;
}
