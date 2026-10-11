import { loader } from "@docvia/core/source";
import { defineDocs } from "@docvia/core/source/macro";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({
	baseUrl: "/docs",
	source: docs.toDocviaSource(),
});
