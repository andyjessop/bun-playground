import type { IndexMetadata } from "../../storage/IndexMetadata";
import type { Context, CustomDurableObjectStub, Next } from "../../types";

export async function indexMetadata(c: Context, next: Next) {
	const logger = c.get("Logger");
	const indexName = c.req.param("index");

	const store = c.env.INDEX_METADATA.idFromName(indexName);
	const stub = c.env.INDEX_METADATA.get(
		store,
	) as unknown as CustomDurableObjectStub<IndexMetadata>;

	if (!indexName || !store) {
		logger.error(`Invalid index name: ${indexName}`);

		return c.json(
			{
				error: `Invalid index name: ${indexName}`,
			},
			400,
		);
	}

	c.set("IndexMetadata", stub);

	await next();
}
