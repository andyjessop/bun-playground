import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";
import { Pipeline } from "../../../packages/pipeline/src/pipeline";
import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages.mjs";

export type Env = {
	ANTHROPIC_API_KEY: string;
	MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
};

const app = new Hono<{ Bindings: Env }>();

export default {
	fetch: app.fetch,
};

app.post("/run", async (c) => {
	const { env, json, req } = c;

	const anthropic = new Anthropic({
		apiKey: env.ANTHROPIC_API_KEY,
	});

	const { prompt } = await req.json<{ prompt: string }>();

	const result = await new Pipeline<string, string>()
		.pipe(async (prompt: string) => {
			const res = await anthropic.messages.create({
				model: "claude-3-5-sonnet-20240620",
				max_tokens: 1024,
				messages: [{ role: "user", content: prompt }],
			});

			return (res.content[0] as unknown as { text: string }).text as string;
		})
		.evaluate((prompt: string) => Boolean(prompt.length))
		.run(prompt);

	return json(result);
});

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject {
	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}

	// export default {
	// 	/**
	// 	 * This is the standard fetch handler for a Cloudflare Worker
	// 	 *
	// 	 * @param request - The request submitted to the Worker from the client
	// 	 * @param env - The interface to reference bindings declared in wrangler.toml
	// 	 * @param ctx - The execution context of the Worker
	// 	 * @returns The response to be sent back to the client
	// 	 */
	// 	async fetch(request, env, ctx): Promise<Response> {
	// 		// We will create a `DurableObjectId` using the pathname from the Worker request
	// 		// This id refers to a unique instance of our 'MyDurableObject' class above
	// 		let id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName(new URL(request.url).pathname);

	// 		// This stub creates a communication channel with the Durable Object instance
	// 		// The Durable Object constructor will be invoked upon the first call for a given id
	// 		let stub = env.MY_DURABLE_OBJECT.get(id);

	// 		// We call the `sayHello()` RPC method on the stub to invoke the method on the remote
	// 		// Durable Object instance
	// 		let greeting = await stub.sayHello("world");

	// 		return new Response(greeting);
	// 	},
	// } satisfies ExportedHandler<Env>;
}
