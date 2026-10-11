"use client";

import {
	installCodeGroups,
	installCopyButtons,
} from "@docvia/core/react/client";
import { useEffect } from "react";

/** Browser behaviour for docs pages: code-group tabs and copy buttons. Hydrate interactive components here too. */
export function DocviaClient() {
	useEffect(() => {
		installCodeGroups();
		installCopyButtons();
	}, []);
	return null;
}
