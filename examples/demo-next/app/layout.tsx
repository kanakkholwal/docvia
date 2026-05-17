import "@fontsource-variable/geist/wght.css";
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
		<html lang="en" data-theme="dark" suppressHydrationWarning>
			<body>{children}</body>
		</html>
	);
}
