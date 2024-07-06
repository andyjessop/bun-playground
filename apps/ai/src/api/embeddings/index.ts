import type { Context } from "../../types";

export async function getEmbedding(c: Context) {
	const vectorDb = c.get("VectorDb");
	const id = c.req.param("id");
	const entry = await vectorDb.getById(id);

	if (!entry) {
		return c.json(
			{
				error: "Entry not found.",
			},
			404,
		);
	}

	return c.json({
		data: entry,
	});
}

export async function createEmbeddings(c: Context) {
	const body = await c.req.json<{
		name: string;
		content: string;
		metadata: Record<string, VectorizeVectorMetadataValue>;
	}>();

	const { content, metadata } = body;

	const vectorDb = c.get("VectorDb");

	const id = crypto.randomUUID();
	const chunks = await vectorDb.upsert(id, content, metadata);

	if (!chunks) {
		return c.json(
			{
				error: "Failed to embed entry",
			},
			500,
		);
	}

	const entry = { id, chunks, metadata };

	return c.json({
		data: entry,
	});
}

export async function deleteEmbedding(c: Context) {
	const id = c.req.param("id");
	const vectorDb = c.get("VectorDb");

	const existsInVectorDb = await vectorDb.getById(id);

	if (!existsInVectorDb) {
		return c.json(
			{
				error: "Entry not found.",
			},
			404,
		);
	}

	const deletedCount = await vectorDb.delete(id);

	if (!deletedCount) {
		return c.json(
			{
				error: "Failed to delete entry from vector database.",
			},
			401,
		);
	}

	return c.json({
		data: "ok",
	});
}

export async function deleteEmbeddingsByMetadata(c: Context) {
	const vectorDb = c.get("VectorDb");

	const body = await c.req.json<{
		metadata: Record<string, VectorizeVectorMetadataValue>;
	}>();

	const { metadata } = body;

	const deletedCount = await vectorDb.deleteByMetadata(metadata);

	if (!deletedCount) {
		return c.json(
			{
				error: "Failed to delete entry from vector database.",
			},
			401,
		);
	}

	return c.json({
		data: "ok",
	});
}

export async function getSimilar(c: Context) {
	const body = await c.req.json<{
		content: string;
		metadata?: Record<string, VectorizeVectorMetadataValue>;
	}>();

	const { content, metadata } = body;

	const vectorDb = c.get("VectorDb");
	const matches = await vectorDb.getSimilar(content, metadata);

	return c.json({
		data: matches,
	});
}
