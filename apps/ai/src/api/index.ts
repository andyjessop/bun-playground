import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { auth } from "./middleware/auth";
import { logger } from "./middleware/logger";
import { vectorDb } from "./middleware/vector-db";
import { indexMetadata } from "./middleware/index-metadata";
import { cors } from "hono/cors";
import { textEmbeddings } from "./middleware/text-embeddings";
import { textGeneration } from "./middleware/text-generation";
import { deleteEntry, getAllEntries, getEntry, putEntry } from "./metadata";
import {
	createEmbeddings,
	deleteEmbedding,
	getEmbedding,
	getSimilar,
} from "./embeddings";

export const api = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Middleware.
 */
api.use(cors({ origin: ["app://obsidian.md"] }));
api.use(logger);
api.use(auth);
api.use(textGeneration);

/**
 * Vector DB.
 * :index is the name of the index as defined in ./config.ts
 */
api.use(":index/*", textEmbeddings);
api.use(":index/*", vectorDb);
api.use(":index/*", indexMetadata);
api.post(":index/embeddings", createEmbeddings);
api.get(":index/embeddings/:id", getEmbedding);
api.delete(":index/embeddings/:id", deleteEmbedding);
api.post(":index/embeddings/delete_by_metadata", deleteEmbedding);
api.post(":index/embeddings/similar", getSimilar);
api.get(":index/metadata", getAllEntries);
api.get(":index/metadata/:key", getEntry);
api.post(":index/metadata/:key", putEntry);
api.delete(":index/metadata/:key", deleteEntry);
