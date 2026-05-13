// Minimal OpenAPI 3.x types. We intentionally don't model the full spec — only
// what the renderer reads. Unknown fields are preserved as `unknown` so this
// stays forward-compatible with 3.1.

export type HttpMethod =
	| "get"
	| "post"
	| "put"
	| "patch"
	| "delete"
	| "options"
	| "head"
	| "trace";

export const HTTP_METHODS: readonly HttpMethod[] = [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"options",
	"head",
	"trace",
];

export interface OpenAPIInfo {
	readonly title?: string;
	readonly version?: string;
	readonly description?: string;
}

export interface OpenAPIParameter {
	readonly name: string;
	readonly in: "query" | "path" | "header" | "cookie";
	readonly description?: string;
	readonly required?: boolean;
	readonly schema?: OpenAPISchema;
}

export interface OpenAPIReference {
	readonly $ref: string;
}

export type OpenAPIParameterOrRef = OpenAPIParameter | OpenAPIReference;

export interface OpenAPISchema {
	readonly type?: string;
	readonly format?: string;
	readonly enum?: readonly unknown[];
	readonly items?: OpenAPISchema;
	readonly properties?: Readonly<Record<string, OpenAPISchema>>;
	readonly required?: readonly string[];
	readonly example?: unknown;
	readonly $ref?: string;
	readonly [key: string]: unknown;
}

export interface OpenAPIMediaType {
	readonly schema?: OpenAPISchema;
	readonly example?: unknown;
	readonly examples?: Readonly<
		Record<string, { readonly value?: unknown; readonly summary?: string }>
	>;
}

export interface OpenAPIRequestBody {
	readonly description?: string;
	readonly required?: boolean;
	readonly content?: Readonly<Record<string, OpenAPIMediaType>>;
}

export interface OpenAPIResponse {
	readonly description?: string;
	readonly content?: Readonly<Record<string, OpenAPIMediaType>>;
}

export interface OpenAPIOperation {
	readonly summary?: string;
	readonly description?: string;
	readonly operationId?: string;
	readonly tags?: readonly string[];
	readonly deprecated?: boolean;
	readonly parameters?: readonly OpenAPIParameterOrRef[];
	readonly requestBody?: OpenAPIRequestBody;
	readonly responses?: Readonly<Record<string, OpenAPIResponse>>;
}

export type OpenAPIPathItem = Partial<Record<HttpMethod, OpenAPIOperation>> & {
	readonly parameters?: readonly OpenAPIParameterOrRef[];
};

export interface OpenAPIDocument {
	readonly openapi?: string;
	readonly info?: OpenAPIInfo;
	readonly servers?: readonly { readonly url: string }[];
	readonly paths?: Readonly<Record<string, OpenAPIPathItem>>;
	readonly components?: {
		readonly schemas?: Readonly<Record<string, OpenAPISchema>>;
	};
	readonly [key: string]: unknown;
}
