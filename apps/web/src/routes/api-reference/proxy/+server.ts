import { createProxyHandler } from "@docvia/plugin-openapi/proxy";
import { proxyRoute } from "#lib/api-reference.ts";
import type { RequestHandler } from "./$types";

// Lets the workspace call the spec's own servers without CORS; nothing else is reachable.
export const prerender = false;

const proxy = createProxyHandler({ servers: proxyRoute.servers });
const handler: RequestHandler = ({ request }) => proxy(request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
