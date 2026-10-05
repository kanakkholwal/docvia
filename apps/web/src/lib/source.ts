import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";

const docs = defineDocs({ dir: "src/docs" });

export const source = loader({
	baseUrl: "/docs",
	source: docs.toDocviaSource(),
});
