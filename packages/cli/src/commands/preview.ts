import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { c, log } from "../logger";

export interface PreviewOptions {
	out: string;
	port: string;
}

export async function runPreview(opts: PreviewOptions): Promise<void> {
	const outDir = resolve(opts.out);

	if (!existsSync(outDir)) {
		log.error(`${c.red("[ERROR]")} Output directory not found: ${outDir}`);
		log.plain(`  Run ${c.cyan("docvia build")} first.`);
		process.exit(1);
	}

	log.warn(
		"`docvia preview` serves the raw .docvia/ output via sirv. It is intended as a sanity-check for the generated module graph, not a standalone runtime. For a real preview, embed docvia in your Vite or Next.js app.",
	);

	try {
		const { createServer } = await import("node:http");
		const sirv = (await import("sirv")).default;
		const handler = sirv(outDir, { dev: true, single: false });
		const server = createServer(handler);
		const port = Number.parseInt(opts.port, 10);
		if (Number.isNaN(port) || port < 0 || port > 65535) {
			log.error(`${c.red("[ERROR]")} Invalid --port: ${opts.port}`);
			process.exit(1);
		}

		server.listen(port, () => {
			log.success(
				`Preview server running at ${c.cyan(`http://localhost:${port}`)}`,
			);
		});

		const close = () => {
			server.close();
			process.exit(0);
		};
		process.once("SIGINT", close);
		process.once("SIGTERM", close);
	} catch (err) {
		log.error(
			`${c.red("[ERROR]")} Failed to start preview server: ${(err as Error).message}`,
		);
		process.exit(1);
	}
}
