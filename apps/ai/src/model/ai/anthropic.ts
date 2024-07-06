import Anthropic from "@anthropic-ai/sdk";
import type { TextGeneration } from "./types";

export class AnthropicTextGeneration implements TextGeneration {
	#apiKey: string;
	#model: string;

	constructor(apiKey: string, model = "claude-3-5-sonnet-20240620") {
		this.#apiKey = apiKey;
		this.#model = model;
	}

	async generateText(str: string): Promise<string | null> {
		const anthropic = new Anthropic({
			apiKey: this.#apiKey,
		});

		const res = await anthropic.messages.create({
			model: this.#model,
			max_tokens: 1024,
			messages: [{ role: "user", content: str }],
		});

		return (
			((res?.content?.[0] as unknown as { text: string }).text as string) ??
			null
		);
	}
}
