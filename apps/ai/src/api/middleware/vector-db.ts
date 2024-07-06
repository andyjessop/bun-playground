import { VectorDb } from "../../model/ai/vector-db/VectorDb";
import type { Context, Next } from "../../types";
import { indexes } from "../config";

export async function vectorDb(c: Context, next: Next) {
	const logger = c.get("Logger");
	const textEmbeddings = c.get("TextEmbeddings");
	const indexName = c.req.param("index");

	// Use the parameter to get the index from c.env
	const index = c.env[indexes[indexName]] as VectorizeIndex;

	if (!indexName || !index) {
		logger.error(`Invalid index name: ${indexName}`);

		return c.json(
			{
				error: `Invalid index name: ${indexName}`,
			},
			400,
		);
	}

	c.set("VectorDb", new VectorDb(textEmbeddings, index, 1536, logger));

	await next();
}
