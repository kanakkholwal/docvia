import { absolute } from "#lib/seo.ts";

export const prerender = true;

export function GET() {
	// The API proxy and search endpoint are for the site's own pages, not crawlers.
	const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /api-reference/proxy
Disallow: /api-reference/drafts

Sitemap: ${absolute("/sitemap.xml")}
`;
	return new Response(body, { headers: { "content-type": "text/plain" } });
}
