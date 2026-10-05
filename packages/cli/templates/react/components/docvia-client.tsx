"use client";

import { installCodeGroups } from "@docvia/renderer-react/client";
import { useEffect } from "react";

/** Browser behaviour for docs pages: code-group tabs. Hydrate interactive components here too. */
export function DocviaClient() {
	useEffect(() => installCodeGroups(), []);
	return null;
}
