import type { Context } from "../../types";

export async function getAllEntries(c: Context) {
	const indexMetadata = c.get("IndexMetadata");

	try {
		const entries = await indexMetadata.entries();
		return c.json({ data: entries });
	} catch (error) {
		return c.json({ error: "Failed to retrieve entries" }, 500);
	}
}

export async function getEntry<T>(c: Context) {
	const key = c.req.param("key");

	if (!key) {
		return c.json({ error: "Missing id parameter" }, 400);
	}

	const indexMetadata = c.get("IndexMetadata");

	try {
		const entry = (await indexMetadata.get(key)) as T;

		if (!entry) {
			return c.json({ error: "Entry not found" }, 404);
		}

		return c.json({ data: entry });
	} catch (error) {
		return c.json({ error: "Failed to retrieve entry" }, 500);
	}
}

export async function putEntry<T>(c: Context) {
	const key = c.req.param("key");

	const body = await c.req.json<{
		value: T;
	}>();

	const { value } = body;

	const indexMetadata = c.get("IndexMetadata");

	try {
		await indexMetadata.put(key, value);

		return c.json({ data: value });
	} catch (error) {
		return c.json({ error: "Failed to create entry." }, 500);
	}
}

export async function deleteEntry(c: Context) {
	const key = c.req.param("key");

	const indexMetadata = c.get("IndexMetadata");

	try {
		const existingEntry = await indexMetadata.get(key);

		if (!existingEntry) {
			return c.json({ error: "Entry not found" }, 404);
		}

		await indexMetadata.delete(key);

		return c.json({ message: "Entry deleted successfully" });
	} catch (error) {
		return c.json({ error: "Failed to delete entry" }, 500);
	}
}
