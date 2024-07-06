import type { Logger } from "../../../../../../packages/logger/src/logger";
import type { TextEmbeddings } from "../types";
import { splitTextIntoChunks } from "./text-splitter";

const MAX_META_LENGTH = 10_000;
const MAX_CONTENT_LENGTH = MAX_META_LENGTH - 1_000;
const MAX_TOP_K = 20;

export class VectorDb {
	#textEmbeddings: TextEmbeddings;
	#index: VectorizeIndex;
	#indexDimensions: number;
	#logger: Logger;

	constructor(
		textEmbeddings: TextEmbeddings,
		index: VectorizeIndex,
		indexDimensions: number,
		logger: Logger,
	) {
		this.#textEmbeddings = textEmbeddings;
		this.#index = index;
		this.#indexDimensions = indexDimensions;
		this.#logger = logger;
	}

	async delete(id: string): Promise<number> {
		this.#logger.info(`Deleting vectors for id ${id}.`);

		let deletedCount = 0;
		let keepSearching = true;
		const queryVector = new Array(this.#indexDimensions).fill(0);

		while (keepSearching) {
			const resultIds = (
				await this.#index.query(queryVector, {
					filter: { id },
					topK: MAX_TOP_K,
					returnValues: false,
					returnMetadata: true,
				})
			).matches.map((match) => match.id);

			if (resultIds.length === 0) {
				keepSearching = false;
			} else {
				const { count } = await this.#index.deleteByIds(resultIds);

				deletedCount += count;

				if (resultIds.length < MAX_TOP_K) {
					keepSearching = false;
				}
			}
		}

		return deletedCount;
	}

	async deleteByMetadata(
		metadata: Record<string, VectorizeVectorMetadataValue>,
	): Promise<number> {
		this.#logger.info(
			`Deleting vectors matching metadata ${JSON.stringify(metadata)}.`,
		);

		let deletedCount = 0;
		let keepSearching = true;
		const queryVector = new Array(this.#indexDimensions).fill(0);
		const filter = convertMetadataToFilter(metadata, this.#logger);

		while (keepSearching) {
			const resultIds = (
				await this.#index.query(queryVector, {
					filter,
					topK: MAX_TOP_K,
					returnValues: false,
					returnMetadata: true,
				})
			).matches.map((match) => match.id);

			if (resultIds.length === 0) {
				keepSearching = false;
			} else {
				const { count } = await this.#index.deleteByIds(resultIds);

				deletedCount += count;

				if (resultIds.length < MAX_TOP_K) {
					keepSearching = false;
				}
			}
		}

		return deletedCount;
	}

	async upsert(
		id: string,
		content: string,
		metadata?: Record<string, VectorizeVectorMetadataValue>,
	): Promise<string[]> {
		this.#logger.info(`Upserting content for ${id}.`);

		if (metadata && !this.isValidMetadata(metadata)) {
			this.#logger.error(
				`Invalid metadata for ${id}. Aborting vector creation.`,
			);
			return [];
		}

		// Step 1: Delete existing vectors with the same groupId
		await this.delete(id);

		// Step 2: Split content into chunks
		const chunks = await splitTextIntoChunks(content);
		const ids = [] as string[];

		// Step 3: Upsert chunks
		for (let i = 0; i < chunks.length; i++) {
			const chunkId = `${id}-${i}`;
			ids.push(chunkId);
			const chunkContent = chunks[i];

			this.#logger.info(`Generating vector for chunk ${chunkId}.`);

			const vector = await this.#textEmbeddings.createVector(chunkContent);

			if (!vector) {
				this.#logger.error(
					`Failed to create embeddings for ${chunkId}. Cleaning up and exiting.`,
				);
				await this.delete(id);

				return [];
			}

			this.#logger.success(`Generated vector for chunk ${chunkId}.`);
			this.#logger.info(`Inserting vector for chunk ${chunkId}.`);

			const meta = {
				chunkId,
				id,
				content: chunkContent,
				...metadata,
			};

			const upserted = await this.#index.upsert([
				{ id: chunkId, values: vector, metadata: meta },
			]);

			if (!upserted || upserted.count === 0) {
				this.#logger.error(
					`Failed to insert embeddings for ${chunkId}. Cleaning up and exiting.`,
				);

				// If we fail to insert a single chunk, we delete the whole id.
				await this.delete(id);

				return [];
			}

			this.#logger.success(`Inserted vector for chunk ${chunkId}`);
		}

		return ids;
	}

	async getById(id: string): Promise<VectorizeVector | undefined> {
		const results = await this.#index.getByIds([id]);

		this.#logger.info(`Found ${results.length} entries.`);

		return results[0];
	}

	async getByIds(ids: string[]): Promise<VectorizeVector[]> {
		const results = await this.#index.getByIds(ids);

		this.#logger.info(`Found ${results.length} entries.`);

		return results;
	}

	async getSimilar(
		content: string,
		metadata?: Record<string, unknown>,
		numResults = MAX_TOP_K,
	): Promise<VectorizeMatches["matches"]> {
		this.#logger.info("Searching for similar content.");

		const queryVector = await this.#textEmbeddings.createVector(content);

		if (!queryVector) {
			this.#logger.error("Failed to generate embeddings for query.");
			return [];
		}

		const filter = metadata
			? convertMetadataToFilter(metadata, this.#logger)
			: undefined;

		const results = await this.#index.query(queryVector, {
			topK: numResults,
			filter,
			returnValues: false,
			returnMetadata: true,
		});

		this.#logger.info(`Found ${results.matches.length} matches.`);

		return results.matches;
	}

	private isValidMetadata(
		metadata: Record<string, unknown>,
	): metadata is Record<string, VectorizeVectorMetadataValue> {
		const keys = Object.keys(metadata);

		for (const key of keys) {
			const value = metadata[key];

			if (!isMetadataFilterValue(value)) {
				this.#logger.warn(
					`Invalid metadata value for key ${key}: ${metadata[key]}`,
				);
				return false;
			}
		}

		return true;
	}
}

function isMetadataFilterValue(
	value: unknown,
): value is VectorizeVectorMetadataFilter[keyof VectorizeVectorMetadataFilter] {
	return (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean" ||
		value === null ||
		value === undefined
	);
}

export async function create40CharHash(message: string) {
	const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
	const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8); // hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(""); // convert bytes to hex string
	return hashHex;
}

function convertMetadataToFilter(
	metadata: Record<string, unknown>,
	logger: Logger,
): VectorizeVectorMetadataFilter {
	const filter: VectorizeVectorMetadataFilter = {};
	const keys = Object.keys(metadata);

	for (const key of keys) {
		const value = metadata[key];
		if (isMetadataFilterValue(value)) {
			filter[key] = value;
		} else {
			logger.warn(
				`Invalid metadata filter value for key ${key}: ${metadata[key]}`,
			);
		}
	}
	return filter;
}
