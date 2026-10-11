import { reference } from "#lib/api-reference.ts";
import { absolute } from "#lib/seo.ts";
import { source } from "#lib/source.ts";

export const prerender = true;

export function GET() {
	const pages = source
		.getPages()
		.filter((p) => !(p.data as { draft?: boolean }).draft)
		.map((p) => p.url);
	const urls = [
		"/",
		...pages,
		...reference.index.operations.map((op) => `/api-reference/${op.slug}`),
	];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)].map((u) => `<url><loc>${absolute(u)}</loc></url>`).join("\n")}
</urlset>
`;
	return new Response(body, { headers: { "content-type": "application/xml" } });
}
