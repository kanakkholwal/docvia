"use client";
import { useState } from "react";

function Greeting() {
	const [name, setName] = useState("");

	return (
		<div className="counter-card">
			<input
				type="text"
				placeholder="Enter your name"
				className="btn"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<button
				disabled={name.trim() === ""}
				className="btn btn-primary mt-2"
				type="button"
				onClick={() => {
					if (name.trim()) {
						alert(`Hello, ${name}!`);
					} else {
						alert("Please enter your name.");
					}
				}}
			>
				Greet
			</button>
		</div>
	);
}

export default Greeting;
