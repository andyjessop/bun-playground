import type { Env } from "../types";

/**
 * This is the name you need to provide in the url, e.g. /notes/embeddings/..
 * will load the NOTES_INDEX_2.
 */
export const indexes = {
	notes: "NOTES_INDEX_2",
} as Record<string, keyof Env>;

export const embeddingsProviders = {
	notes: "cloudflare",
} as Record<string, "cloudflare" | "openai">;

export const embeddingsModel = {
	notes: "@cf/baai/bge-large-en-v1.5",
} as Record<string, string>;
