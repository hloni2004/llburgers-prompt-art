import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a short, human-readable order reference from a UUID.
 * e.g. "1525c7f4-cc98-4cee-8eb9-16e2e68a8d51" → "#LL-1525C7F4"
 */
export function formatOrderRef(id: string): string {
  return `#LL-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}
