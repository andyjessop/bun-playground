import type { TextEmbeddings, TextGeneration } from "./types";
import OpenAi from "openai";

export class CloudflareTextGeneration implements TextGeneration {
	#apiKey: string;
	#accountId: string;
	#model: string;

	constructor(
		apiKey: string,
		accountId: string,
		model = "@cf/meta/llama-3-8b-instruct",
	) {
		this.#apiKey = apiKey;
		this.#accountId = accountId;
		this.#model = model;
	}

	async generateText(str: string): Promise<string | null> {
		const openai = new OpenAi({
			apiKey: this.#apiKey,
			baseURL: `https://api.cloudflare.com/client/v4/accounts/${this.#accountId}/ai/v1`,
		});

		const chatCompletion = await openai.chat.completions.create({
			messages: [{ role: "user", content: str }],
			model: this.#model,
		});

		return chatCompletion.choices[0]?.message?.content ?? null;
	}
}

export class CloudflareTextEmbeddings implements TextEmbeddings {
	#apiKey: string;
	#accountId: string;
	#model: string;

	constructor(
		apiKey: string,
		accountId: string,
		model = "@cf/baai/bge-large-en-v1.5",
	) {
		this.#apiKey = apiKey;
		this.#accountId = accountId;
		this.#model = model;
	}

	async createVector(str: string): Promise<number[] | null> {
		const openai = new OpenAi({
			apiKey: this.#apiKey,
			baseURL: `https://api.cloudflare.com/client/v4/accounts/${this.#accountId}/ai/v1`,
		});

		const embeddings = await openai.embeddings.create({
			model: this.#model,
			input: str,
		});

		return embeddings?.data?.[0].embedding ?? null;
	}
}
