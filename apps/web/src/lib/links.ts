/** `target` and `rel` for links that leave the site; spread onto an `<a>` or a link Button. */
export const external = (href: string) =>
	/^(?:https?:)?\/\//.test(href)
		? { target: "_blank", rel: "noopener noreferrer" }
		: {};
