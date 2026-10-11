import { describe, expect, it, vi } from "vitest";
import {
	createProxyHandler,
	isAllowedTarget,
	isPrivateHost,
	PROXY_HEADER,
} from "../src/proxy";
import { routeRequest } from "../src/source";

const SERVERS = ["https://api.example.com/v1"];
const call = (target: string, init: RequestInit = {}) =>
	new Request(
		`https://docs.example.org/proxy?url=${encodeURIComponent(target)}`,
		init,
	);

function upstream(response = new Response("{}", { status: 200 })) {
	return vi.fn(async (_url: URL | Request | string, _init?: RequestInit) =>
		response.clone(),
	);
}

describe("proxy guards", () => {
	it("allows only paths under a spec server", () => {
		const ok = (u: string) => isAllowedTarget(new URL(u), SERVERS);
		expect(ok("https://api.example.com/v1/pets?x=1")).toBe(true);
		expect(ok("https://api.example.com/v1")).toBe(true);
		expect(ok("https://api.example.com/v10/pets")).toBe(false);
		expect(ok("https://api.example.com/admin")).toBe(false);
		expect(ok("http://api.example.com/v1/pets")).toBe(false);
	});

	it("treats loopback, private ranges and local names as private", () => {
		for (const host of [
			"localhost",
			"127.0.0.1",
			"10.1.2.3",
			"172.20.0.1",
			"192.168.1.1",
			"169.254.169.254",
			"[::1]",
			"fd00::1",
			"::ffff:10.0.0.1",
			"intranet",
			"db.internal",
		])
			expect(isPrivateHost(host), host).toBe(true);
		for (const host of ["api.example.com", "8.8.8.8", "2606:4700::1111"])
			expect(isPrivateHost(host), host).toBe(false);
	});
});

describe("createProxyHandler", () => {
	it("forwards to a spec server without cookies, and drops Set-Cookie", async () => {
		const fetch = upstream(
			new Response('{"ok":true}', {
				status: 201,
				headers: { "content-type": "application/json", "set-cookie": "s=1" },
			}),
		);
		const handler = createProxyHandler({ servers: SERVERS, fetch });
		const response = await handler(
			call("https://api.example.com/v1/pets", {
				method: "POST",
				headers: {
					authorization: "Bearer t",
					cookie: "session=secret",
					"content-type": "application/json",
				},
				body: '{"name":"Rex"}',
			}),
		);
		expect(response.status).toBe(201);
		expect(await response.text()).toBe('{"ok":true}');
		expect(response.headers.has("set-cookie")).toBe(false);
		expect(response.headers.get(PROXY_HEADER)).toBe("1");
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(String(url)).toBe("https://api.example.com/v1/pets");
		const sent = new Headers(init?.headers);
		expect(sent.get("authorization")).toBe("Bearer t");
		expect(sent.has("cookie")).toBe(false);
		expect(init?.redirect).toBe("manual");
	});

	it("refuses other hosts, private hosts and bad URLs before fetching", async () => {
		const fetch = upstream();
		const handler = createProxyHandler({
			servers: [...SERVERS, "http://127.0.0.1:8080"],
			fetch,
		});
		expect((await handler(call("https://evil.example.net/v1"))).status).toBe(
			403,
		);
		expect((await handler(call("http://127.0.0.1:8080/x"))).status).toBe(403);
		expect((await handler(call("not a url"))).status).toBe(400);
		expect((await handler(call("ftp://api.example.com/v1"))).status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("caps request and response sizes", async () => {
		const handler = createProxyHandler({
			servers: SERVERS,
			maxRequestBytes: 4,
			maxResponseBytes: 8,
			fetch: upstream(new Response("0123456789")),
		});
		const big = await handler(
			call("https://api.example.com/v1/x", { method: "POST", body: "12345" }),
		);
		expect(big.status).toBe(413);
		const response = await handler(call("https://api.example.com/v1/x"));
		await expect(response.text()).rejects.toThrow(/over 8 bytes/);
	});

	it("reports an unreachable upstream as 502", async () => {
		const handler = createProxyHandler({
			servers: SERVERS,
			fetch: vi.fn(async () => {
				throw new TypeError("fetch failed");
			}),
		});
		const response = await handler(call("https://api.example.com/v1/x"));
		expect(response.status).toBe(502);
		expect(response.headers.get(PROXY_HEADER)).toBe("error");
	});
});

describe("routeRequest", () => {
	const proxy = { path: "/proxy", servers: SERVERS };
	const origin = "https://docs.example.org";
	it("sends same-origin directly, spec servers through the proxy, others direct", () => {
		expect(routeRequest("/api/pets", origin, proxy)).toEqual({
			route: "same-origin",
			fetchUrl: "https://docs.example.org/api/pets",
		});
		expect(
			routeRequest("https://api.example.com/v1/pets", origin, proxy),
		).toEqual({
			route: "proxy",
			fetchUrl: "/proxy?url=https%3A%2F%2Fapi.example.com%2Fv1%2Fpets",
		});
		expect(
			routeRequest("https://other.example.com/x", origin, proxy).route,
		).toBe("direct");
	});
});
