import { CloudflareTextEmbeddings } from "../../model/ai/cloudflare";
import { OpenAiTextEmbeddings } from "../../model/ai/openai";
import type { TextEmbeddings } from "../../model/ai/types";
import type { Context, Next } from "../../types";
import { embeddingsProviders, embeddingsModel } from "../config";

export async function textEmbeddings(c: Context, next: Next) {
	const logger = c.get("Logger");
	const indexName = c.req.param("index");

	let textEmbeddings: TextEmbeddings | null = null;

	const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
	const CLOUDFLARE_API_TOKEN = c.env.CLOUDFLARE_API_TOKEN;
	const CLOUDFLARE_ACCOUNT_ID = c.env.CLOUDFLARE_ACCOUNT_ID;

	const provider = embeddingsProviders[indexName];
	const model = embeddingsModel[indexName];

	switch (provider) {
		case "openai":
			if (!OPENAI_API_KEY) {
				logger.error("No OPENAI_API_KEY provided.");
				return c.json({ error: "Unauthorized: Missing OpenAI API key" }, 401);
			}
			textEmbeddings = new OpenAiTextEmbeddings(OPENAI_API_KEY);
			break;
		case "cloudflare":
			if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
				logger.error("Missing Cloudflare credentials.");
				return c.json(
					{ error: "Unauthorized: Missing Cloudflare credentials" },
					401,
				);
			}
			textEmbeddings = new CloudflareTextEmbeddings(
				CLOUDFLARE_API_TOKEN,
				CLOUDFLARE_ACCOUNT_ID,
				model,
			);
			break;
		default:
			logger.error("Invalid or missing text embeddings provider.");
			return c.json(
				{ error: "Bad Request: Invalid or missing text embeddings provider" },
				400,
			);
	}

	c.set("TextEmbeddings", textEmbeddings);

	await next();
}
