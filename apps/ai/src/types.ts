import type {
	Hono,
	Context as HonoContext,
	MiddlewareHandler as HonoMiddlewareHandler,
} from "hono";
import type { Logger } from "../../../packages/logger/src/logger";
import type { VectorDb } from "./model/ai/vector-db/VectorDb";
import type { IndexMetadata } from "./storage/IndexMetadata";
import type { TextEmbeddings, TextGeneration } from "./model/ai/types";
import type { DurableObjectStub } from "@cloudflare/workers-types";

export type CustomDurableObjectStub<T> = DurableObjectStub & T;

export type Env = {
	ANTHROPIC_API_KEY: string;
	CLOUDFLARE_ACCOUNT_ID: string;
	CLOUDFLARE_API_TOKEN: string;
	INDEX_METADATA: DurableObjectNamespace<IndexMetadata>;
	NOTES_INDEX_2: VectorizeIndex;
	OPENAI_API_KEY: string;
	VECTOR_DATA_API_KEY: string;
};

export type Variables = {
	TextEmbeddings: TextEmbeddings;
	TextGeneration: TextGeneration;
	IndexMetadata: CustomDurableObjectStub<IndexMetadata>;
	Logger: Logger;
	VectorDb: VectorDb;
};

type T0 = Variables["IndexMetadata"];
type T1 = T0["getAll"];

export type App = Hono<{ Bindings: Env; Variables: Variables }>;

export type MiddlewareHandler = HonoMiddlewareHandler<{
	Bindings: Env;
	Variables: Variables;
}>;
export type Context = HonoContext<{ Bindings: Env; Variables: Variables }>;
export type Next = () => Promise<void>;
