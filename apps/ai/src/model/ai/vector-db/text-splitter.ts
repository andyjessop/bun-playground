import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function splitTextIntoChunks(
	content: string,
	metadata?: Record<string, unknown>,
	language?: "js" | "markdown",
	chunkSize = 1500,
	chunkOverlap = 200,
) {
	let splitter: RecursiveCharacterTextSplitter;

	if (language) {
		splitter = RecursiveCharacterTextSplitter.fromLanguage(language, {
			chunkOverlap,
			chunkSize,
		});
	} else {
		splitter = new RecursiveCharacterTextSplitter({
			chunkOverlap,
			chunkSize,
		});
	}

	const docs = await splitter.createDocuments([content], [], {
		appendChunkOverlapHeader: true,
		chunkHeader: `METADATA: ${JSON.stringify(metadata)}>\n\n---\n\n`,
	});

	return docs.map((doc) => doc.pageContent);
}
