import { AnthropicTextGeneration } from "../../model/ai/anthropic";
import { CloudflareTextGeneration } from "../../model/ai/cloudflare";
import { OpenAiTextGeneration } from "../../model/ai/openai";
import type { TextGeneration } from "../../model/ai/types";
import type { Context, Next } from "../../types";

export async function textGeneration(c: Context, next: Next) {
	const logger = c.get("Logger");

	const textGenerationProvider = c.req.header("text-generation-provider");

	let textGeneration: TextGeneration | null = null;

	const ANTHROPIC_API_KEY = c.env.ANTHROPIC_API_KEY;
	const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
	const CLOUDFLARE_API_TOKEN = c.env.CLOUDFLARE_API_TOKEN;
	const CLOUDFLARE_ACCOUNT_ID = c.env.CLOUDFLARE_ACCOUNT_ID;

	switch (textGenerationProvider) {
		case "anthropic":
			if (!ANTHROPIC_API_KEY) {
				logger.error("No ANTHROPIC_API_KEY provided.");
				return c.json(
					{ error: "Unauthorized: Missing Anthropic API key" },
					401,
				);
			}
			textGeneration = new AnthropicTextGeneration(ANTHROPIC_API_KEY);
			break;
		case "openai":
			if (!OPENAI_API_KEY) {
				logger.error("No OPENAI_API_KEY provided.");
				return c.json({ error: "Unauthorized: Missing OpenAI API key" }, 401);
			}
			textGeneration = new OpenAiTextGeneration(OPENAI_API_KEY);
			break;
		case "cloudflare":
			if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
				logger.error("Missing Cloudflare credentials.");
				return c.json(
					{ error: "Unauthorized: Missing Cloudflare credentials" },
					401,
				);
			}
			textGeneration = new CloudflareTextGeneration(
				CLOUDFLARE_API_TOKEN,
				CLOUDFLARE_ACCOUNT_ID,
			);
			break;
		default:
			logger.info("Missing text generation provider.");
			break;
	}

	if (textGeneration) {
		c.set("TextGeneration", textGeneration);
	}

	await next();
}
