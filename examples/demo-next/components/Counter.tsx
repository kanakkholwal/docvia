"use client";

import { useState } from "react";

interface Props {
	initial?: number;
	children?: React.ReactNode;
}

export function Counter({ initial = 0 }: Props) {
	const [count, setCount] = useState(initial);

	return (
		<div className="counter-card">
			<div className="counter-display">
				<div className="counter-value">{count}</div>
				<p className="counter-label">Count</p>
			</div>
			<div className="counter-controls">
				<button
					className="btn btn-secondary"
					onClick={() => setCount((c) => c - 1)}
					aria-label="Decrease count"
					type="button"
				>
					−
				</button>
				<button
					className="btn btn-secondary"
					onClick={() => setCount(initial)}
					aria-label="Reset count"
					type="button"
				>
					Reset
				</button>
				<button
					className="btn btn-primary"
					onClick={() => setCount((c) => c + 1)}
					aria-label="Increase count"
					type="button"
				>
					+
				</button>
			</div>
		</div>
	);
}

// Default export required — the docvia registry imports this via dynamic path
export default Counter;
