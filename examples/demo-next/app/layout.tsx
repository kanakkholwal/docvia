import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		template: "%s — docvia",
		default: "docvia Documentation",
	},
	description: "Modern documentation site powered by docvia and Next.js",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>{children}</body>
		</html>
	);
}
