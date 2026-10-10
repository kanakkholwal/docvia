import type { RequestHandler } from "./$types";

// A stateless stand-in for src/api/petstore.yaml, so the docs playground has a server to call.
// Writes answer as the real API would but change nothing.
export const prerender = false;

type Pet = {
	id: number;
	name: string;
	species: string;
	status: string;
	createdAt: string;
	birthDate?: string;
	tags?: string[];
	microchip?: { id: string; vendor?: string } | null;
};

const SPECIES = ["dog", "cat", "bird", "rabbit"];
const STATUSES = ["available", "pending", "adopted", "archived"];
const PETS: Pet[] = [
	{
		id: 1042,
		name: "Rex",
		species: "dog",
		status: "available",
		createdAt: "2026-09-30T10:12:00Z",
		birthDate: "2023-04-12",
		tags: ["friendly"],
	},
	{
		id: 1041,
		name: "Mochi",
		species: "cat",
		status: "pending",
		createdAt: "2026-09-28T16:40:00Z",
		microchip: { id: "985112003456789", vendor: "HomeAgain" },
	},
	{
		id: 1040,
		name: "Kiwi",
		species: "bird",
		status: "available",
		createdAt: "2026-09-21T08:05:00Z",
		tags: ["talks"],
	},
	{
		id: 1039,
		name: "Clover",
		species: "rabbit",
		status: "adopted",
		createdAt: "2026-09-15T13:30:00Z",
	},
];
const ORDERS = [
	{ id: "ord_8f2k3", petId: 1041, status: "approved", note: "Weekend pickup" },
];

const CORS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
	"access-control-allow-headers":
		"authorization, content-type, idempotency-key, x-api-key",
	"access-control-expose-headers": "x-ratelimit-remaining",
};

const json = (
	status: number,
	body: unknown,
	headers: Record<string, string> = {},
) =>
	new Response(status === 204 ? null : JSON.stringify(body, null, 2), {
		status,
		headers: {
			...CORS,
			...(status === 204 ? {} : { "content-type": "application/json" }),
			...headers,
		},
	});
const error = (status: number, code: string, message: string) =>
	json(status, { code, message });

async function body(
	request: Request,
): Promise<Record<string, unknown> | Response> {
	try {
		const value = await request.json();
		if (value && typeof value === "object" && !Array.isArray(value))
			return value as Record<string, unknown>;
	} catch {
		// Falls through to the 400 below.
	}
	return error(400, "invalid_body", "The request body must be a JSON object.");
}

function invalidPet(
	input: Record<string, unknown>,
	partial: boolean,
): string | undefined {
	const { name, species, status } = input;
	if (name !== undefined || !partial) {
		if (typeof name !== "string" || name.length < 1 || name.length > 64)
			return "name must be 1 to 64 characters.";
	}
	if (!partial && !SPECIES.includes(String(species)))
		return `species must be one of ${SPECIES.join(", ")}.`;
	if (status !== undefined && !STATUSES.includes(String(status)))
		return `status must be one of ${STATUSES.join(", ")}.`;
	return undefined;
}

const handler: RequestHandler = async ({ request, params, url }) => {
	if (request.method === "OPTIONS")
		return new Response(null, { status: 204, headers: CORS });
	const [resource, id, ...rest] = params.path.split("/");
	const method = request.method;
	const bearer = /^Bearer \S+/.test(request.headers.get("authorization") ?? "");
	const apiKey = Boolean(request.headers.get("x-api-key"));

	if (resource === "pets" && rest.length === 0) {
		const pet = id ? PETS.find((p) => String(p.id) === id) : undefined;
		const publicRead = id && method === "GET";
		if (!publicRead && !bearer)
			return error(
				401,
				"unauthorized",
				"Send a bearer token; any value works in this demo.",
			);

		if (!id && method === "GET") {
			const species = url.searchParams.get("species");
			if (species && !SPECIES.includes(species))
				return error(
					400,
					"invalid_query",
					`species must be one of ${SPECIES.join(", ")}.`,
				);
			const limit = Math.min(
				100,
				Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20),
			);
			const start = Number(url.searchParams.get("cursor") ?? 0) || 0;
			const matching = PETS.filter((p) => !species || p.species === species);
			const data = matching.slice(start, start + limit);
			const next =
				start + limit < matching.length ? String(start + limit) : null;
			return json(
				200,
				{ data, nextCursor: next },
				{ "x-ratelimit-remaining": "99" },
			);
		}
		if (!id && method === "POST") {
			const input = await body(request);
			if (input instanceof Response) return input;
			const problem = invalidPet(input, false);
			if (problem) return error(400, "invalid_body", problem);
			return json(201, {
				...input,
				id: 1043,
				status: "available",
				createdAt: new Date().toISOString(),
			});
		}
		if (id && !pet) return error(404, "not_found", `No pet with id ${id}.`);
		if (pet && method === "GET") return json(200, pet);
		if (pet && method === "PATCH") {
			const input = await body(request);
			if (input instanceof Response) return input;
			const problem = invalidPet(input, true);
			if (problem) return error(400, "invalid_body", problem);
			return json(200, {
				...pet,
				...input,
				id: pet.id,
				createdAt: pet.createdAt,
			});
		}
		if (pet && method === "DELETE") return json(204, null);
	}

	if (resource === "orders" && rest.length === 0) {
		if (!apiKey)
			return error(
				401,
				"unauthorized",
				"Send an X-Api-Key header; any value works in this demo.",
			);
		if (!id && method === "POST") {
			if (!request.headers.get("idempotency-key"))
				return error(400, "missing_header", "Idempotency-Key is required.");
			const input = await body(request);
			if (input instanceof Response) return input;
			const pet = PETS.find((p) => p.id === Number(input.petId));
			if (!pet)
				return error(
					400,
					"invalid_body",
					`No pet with id ${String(input.petId)}.`,
				);
			if (pet.status !== "available")
				return error(409, "unavailable", `${pet.name} is ${pet.status}.`);
			return json(201, {
				id: "ord_9x7q1",
				petId: pet.id,
				status: "placed",
				note: input.note,
			});
		}
		const order = ORDERS.find((o) => o.id === id);
		if (id && method === "GET")
			return order
				? json(200, order)
				: error(404, "not_found", `No order with id ${id}.`);
	}

	return error(
		404,
		"not_found",
		`${method} /${params.path} is not part of this API.`,
	);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
