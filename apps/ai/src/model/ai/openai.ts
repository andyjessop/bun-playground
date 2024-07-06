import OpenAi from "openai";
import type { TextEmbeddings, TextGeneration } from "./types";

export class OpenAiTextGeneration implements TextGeneration {
	#apiKey: string;
	#model: string;

	constructor(apiKey: string, model = "gpt-3.5-turbo") {
		this.#apiKey = apiKey;
		this.#model = model;
	}

	async generateText(str: string): Promise<string | null> {
		const openai = new OpenAi({
			apiKey: this.#apiKey,
		});

		const chatCompletion = await openai.chat.completions.create({
			messages: [{ role: "user", content: str }],
			model: this.#model,
		});

		return chatCompletion.choices[0]?.message?.content ?? null;
	}
}

export class OpenAiTextEmbeddings implements TextEmbeddings {
	#apiKey: string;
	#model: string;

	constructor(apiKey: string, model = "text-embedding-3-small") {
		this.#apiKey = apiKey;
		this.#model = model;
	}

	async createVector(str: string): Promise<number[] | null> {
		const openai = new OpenAi({
			apiKey: this.#apiKey,
		});

		const embedding = await openai.embeddings.create({
			encoding_format: "float",
			input: str,
			model: this.#model,
		});

		return embedding?.data?.[0].embedding ?? null;
	}
}
