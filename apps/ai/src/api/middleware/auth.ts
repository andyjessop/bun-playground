import type { Context, Next } from "../../types";

export async function auth(c: Context, next: Next) {
	const apiKey = c.env.VECTOR_DATA_API_KEY;

	const isAuthorized =
		apiKey !== undefined && c.req.header("vector-data-api-key") === apiKey;

	if (!isAuthorized) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	await next();
}
