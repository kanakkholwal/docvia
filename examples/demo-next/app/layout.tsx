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
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<script
					dangerouslySetInnerHTML={{
						__html: `try{const t=localStorage.getItem("docvia-theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch{}`,
					}}
				/>
			</head>
			<body>{children}</body>
		</html>
	);
}
