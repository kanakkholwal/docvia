import petstore from "virtual:docvia/openapi";
import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";
import {
	type OpenAPIPageData,
	openapiSource,
} from "@docvia/plugin-openapi/source";

const docs = defineDocs({ dir: "src/docs" });
const markdown = docs.toDocviaSource();
const api = openapiSource(petstore, {
	dir: "api-example",
	baseUrl: "/docs",
	title: "API reference example",
});

type MarkdownPage = Extract<
	(typeof markdown.files)[number],
	{ type: "page" }
>["data"];

/** Markdown pages from src/docs, plus the pages generated from the sample OpenAPI spec. */
export const source = loader<MarkdownPage | OpenAPIPageData>({
	baseUrl: "/docs",
	source: { files: [...markdown.files, ...api.files] },
});
