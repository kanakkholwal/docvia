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
	readonly deprecated?: boolean;
	readonly schema?: OpenAPISchema;
	readonly example?: unknown;
	readonly examples?: Readonly<Record<string, OpenAPIExample>>;
}

export interface OpenAPIExample {
	readonly summary?: string;
	readonly value?: unknown;
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
	readonly examples?: Readonly<Record<string, OpenAPIExample>>;
}

export interface OpenAPIRequestBody {
	readonly description?: string;
	readonly required?: boolean;
	readonly content?: Readonly<Record<string, OpenAPIMediaType>>;
}

export interface OpenAPIResponse {
	readonly description?: string;
	readonly headers?: Readonly<
		Record<string, Omit<OpenAPIParameter, "name" | "in"> | OpenAPIReference>
	>;
	readonly content?: Readonly<Record<string, OpenAPIMediaType>>;
}

export interface OpenAPIServer {
	readonly url: string;
	readonly description?: string;
	readonly variables?: Readonly<Record<string, { readonly default: string }>>;
}

export interface OpenAPITag {
	readonly name: string;
	readonly description?: string;
}

/** Scheme names mapped to required scopes; an empty object means "no auth". */
export type OpenAPISecurityRequirement = Readonly<
	Record<string, readonly string[]>
>;

export interface OpenAPISecurityScheme {
	readonly type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS";
	readonly description?: string;
	readonly name?: string;
	readonly in?: "query" | "header" | "cookie";
	readonly scheme?: string;
	readonly bearerFormat?: string;
}

export interface OpenAPIOperation {
	readonly summary?: string;
	readonly description?: string;
	readonly operationId?: string;
	readonly tags?: readonly string[];
	readonly deprecated?: boolean;
	readonly parameters?: readonly OpenAPIParameterOrRef[];
	readonly requestBody?: OpenAPIRequestBody | OpenAPIReference;
	readonly responses?: Readonly<
		Record<string, OpenAPIResponse | OpenAPIReference>
	>;
	readonly security?: readonly OpenAPISecurityRequirement[];
	readonly servers?: readonly OpenAPIServer[];
}

export type OpenAPIPathItem = Partial<Record<HttpMethod, OpenAPIOperation>> & {
	readonly parameters?: readonly OpenAPIParameterOrRef[];
	readonly servers?: readonly OpenAPIServer[];
};

export interface OpenAPIDocument {
	readonly openapi?: string;
	readonly info?: OpenAPIInfo;
	readonly servers?: readonly OpenAPIServer[];
	readonly tags?: readonly OpenAPITag[];
	readonly security?: readonly OpenAPISecurityRequirement[];
	readonly paths?: Readonly<Record<string, OpenAPIPathItem>>;
	readonly components?: {
		readonly schemas?: Readonly<Record<string, OpenAPISchema>>;
		readonly securitySchemes?: Readonly<
			Record<string, OpenAPISecurityScheme | OpenAPIReference>
		>;
	};
	readonly [key: string]: unknown;
}
