/** HTML rendered from a spec's CommonMark; raw HTML in the spec is escaped. */
export type Html = string;

/** A spec resolved for rendering: refs followed, Markdown rendered, samples generated. Plain JSON. */
export interface ApiDocument {
	readonly title: string;
	readonly version?: string;
	readonly description?: Html;
	readonly servers: readonly ApiServer[];
	readonly tags: readonly ApiTag[];
	readonly operations: readonly ApiOperation[];
}

/** What a page list needs from an operation; the rest loads with the page. */
export type ApiOperationSummary = Pick<
	ApiOperation,
	"slug" | "method" | "path" | "summary" | "deprecated" | "tags"
> & {
	/** Description as plain text, for search. */
	readonly text?: string;
};

export interface ApiIndex extends Omit<ApiDocument, "operations"> {
	readonly operations: readonly ApiOperationSummary[];
}

/** An index up front and operations on demand, so a server bundle holds only what it renders. */
export interface ApiSource {
	readonly index: ApiIndex;
	operation(slug: string): Promise<ApiOperation>;
}

export interface ApiServer {
	readonly url: string;
	readonly description?: string;
}

export interface ApiTag {
	readonly name: string;
	/** URL-safe folder name. */
	readonly slug: string;
	readonly description?: Html;
}

export type ApiMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "OPTIONS"
	| "HEAD"
	| "TRACE";

export interface ApiOperation {
	/** URL-safe page name, from `operationId` or the method and path. */
	readonly slug: string;
	readonly operationId?: string;
	readonly method: ApiMethod;
	readonly path: string;
	readonly summary: string;
	readonly description?: Html;
	readonly deprecated: boolean;
	/** Tag names; the first one places the page. */
	readonly tags: readonly string[];
	readonly servers: readonly ApiServer[];
	/** Alternatives: any one entry satisfies the operation. Empty when it needs no auth. */
	readonly security: readonly ApiSecurity[][];
	readonly parameters: readonly ApiParameter[];
	readonly requestBody?: ApiRequestBody;
	readonly responses: readonly ApiResponse[];
	readonly samples: readonly ApiCodeSample[];
}

export interface ApiSecurity {
	readonly name: string;
	readonly type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS";
	/** `bearer`, `basic`, ... for `http`. */
	readonly scheme?: string;
	readonly bearerFormat?: string;
	/** Where an `apiKey` goes, and under which name. */
	readonly in?: "query" | "header" | "cookie";
	readonly paramName?: string;
	readonly scopes: readonly string[];
	readonly description?: Html;
}

export interface ApiParameter {
	readonly name: string;
	readonly in: "path" | "query" | "header" | "cookie";
	readonly required: boolean;
	readonly deprecated: boolean;
	readonly description?: Html;
	readonly schema: ApiSchema;
	/** The spec's example as it would be typed into a form, when it has one. */
	readonly example?: string;
}

export interface ApiRequestBody {
	readonly required: boolean;
	readonly description?: Html;
	readonly contents: readonly ApiContent[];
}

export interface ApiResponse {
	/** `200`, `4XX` or `default`. */
	readonly status: string;
	readonly description?: Html;
	readonly headers: readonly ApiParameter[];
	readonly contents: readonly ApiContent[];
}

export interface ApiContent {
	readonly mediaType: string;
	readonly schema?: ApiSchema;
	readonly examples: readonly ApiExample[];
}

export interface ApiExample {
	readonly label: string;
	readonly lang: string;
	readonly code: string;
	/** Highlighted markup, when the build was given a highlighter. */
	readonly html?: string;
}

export interface ApiCodeSample extends ApiExample {
	/** Stable id across operations, e.g. `shell-curl`, for a remembered language choice. */
	readonly id: string;
}

export interface ApiSchema {
	/** Display type: `string<email>`, `array<Pet>`, `Pet`, `string | null`. */
	readonly type: string;
	/** Component name when the schema came from a `$ref`. */
	readonly ref?: string;
	readonly description?: Html;
	readonly deprecated?: boolean;
	readonly readOnly?: boolean;
	readonly writeOnly?: boolean;
	readonly nullable?: boolean;
	/** JSON-encoded allowed values. */
	readonly enum?: readonly string[];
	/** JSON-encoded default. */
	readonly default?: string;
	/** Human-readable limits: `>= 1`, `max length 64`, `pattern ^[a-z]+$`. */
	readonly constraints: readonly string[];
	readonly fields?: readonly ApiField[];
	readonly items?: ApiSchema;
	readonly additional?: ApiSchema;
	/** `oneOf` / `anyOf` alternatives; `allOf` is merged into `fields`. */
	readonly variants?: {
		readonly kind: "oneOf" | "anyOf";
		readonly options: readonly ApiSchema[];
	};
	/** Set where a `$ref` points back at a schema already being expanded. */
	readonly circular?: boolean;
}

export interface ApiField {
	readonly name: string;
	readonly required: boolean;
	readonly schema: ApiSchema;
}
