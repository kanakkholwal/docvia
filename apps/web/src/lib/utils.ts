import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatenates Tailwind class names with clsx + tailwind-merge.
 * Standard helper used throughout shadcn-svelte components.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
