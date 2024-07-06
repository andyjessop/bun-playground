export interface TextGeneration {
	generateText(str: string): Promise<string | null>;
}

export interface TextEmbeddings {
	createVector(str: string): Promise<number[] | null>;
}
