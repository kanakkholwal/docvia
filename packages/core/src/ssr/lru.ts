/**
 * Minimal LRU cache. A plain `Map` preserves insertion order, so the first key
 * is the least-recently-used; `get` re-inserts to mark an entry fresh.
 */
export class LRUCache<K, V> {
	private readonly max: number;
	private readonly map = new Map<K, V>();

	constructor(max: number) {
		this.max = Math.max(1, max);
	}

	get(key: K): V | undefined {
		const value = this.map.get(key);
		if (value === undefined) return undefined;
		// Re-insert so the entry becomes most-recently-used.
		this.map.delete(key);
		this.map.set(key, value);
		return value;
	}

	set(key: K, value: V): void {
		if (this.map.has(key)) this.map.delete(key);
		this.map.set(key, value);
		if (this.map.size > this.max) {
			const oldest = this.map.keys().next().value;
			if (oldest !== undefined) this.map.delete(oldest);
		}
	}

	clear(): void {
		this.map.clear();
	}

	get size(): number {
		return this.map.size;
	}
}
