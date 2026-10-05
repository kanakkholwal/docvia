import { loader } from "@docvia/source";
import { defineDocs } from "@docvia/source/macro";
import { z } from "zod/v3";

const docs = defineDocs({
	dir: "docs",
	// Extra frontmatter fields on top of the built-ins (any Standard Schema library).
	docs: {
		schema: z.object({
			author: z.string().optional(),
			order: z.number().optional(),
		}),
	},
});

export const source = loader({
	baseUrl: "/docs",
	source: docs.toDocviaSource(),
});
