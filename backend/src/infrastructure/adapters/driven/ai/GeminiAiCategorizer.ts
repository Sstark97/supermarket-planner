import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProductCategory } from "@domain/entities/IProduct";
import type { AiCategorizer } from "@application/ports/outgoing/AiCategorizer";
import { CATEGORY_DEFINITIONS } from "./categoryPromptDefinitions";

interface GeminiLikeModel {
	generateContent(prompt: string): Promise<{ response: { text(): string } }>;
}

export interface GeminiClient {
	getGenerativeModel(opts: { model: string }): GeminiLikeModel;
}

export interface GeminiAiCategorizerDeps {
	apiKey: string;
	model: string;
	logger?: {
		warn(message: string): void;
		error(message: string): void;
	};
	clientFactory?: (apiKey: string) => GeminiClient;
}

export class GeminiAiCategorizer implements AiCategorizer {
	private readonly apiKey: string;
	private readonly model: string;
	private readonly logger?: {
		warn(message: string): void;
		error(message: string): void;
	};
	private readonly clientFactory: (apiKey: string) => GeminiClient;

	constructor(deps: GeminiAiCategorizerDeps) {
		this.apiKey = deps.apiKey;
		this.model = deps.model;
		this.logger = deps.logger;
		this.clientFactory =
			deps.clientFactory ??
			((apiKey) => new GoogleGenerativeAI(apiKey) as unknown as GeminiClient);
	}

	async categorize(productName: string): Promise<ProductCategory | undefined> {
		if (!this.apiKey) {
			this.logger?.warn(
				"[GeminiAiCategorizer] GEMINI_API_KEY not set, skipping AI fallback.",
			);
			return undefined;
		}

		try {
			const client = this.clientFactory(this.apiKey);
			const model = client.getGenerativeModel({ model: this.model });
			const prompt = this.buildCategorizationPrompt(productName);

			const result = await model.generateContent(prompt);
			const normalized = result.response.text().trim().toLowerCase();

			return (
				Object.values(ProductCategory).find(
					(category) => category === normalized,
				) ?? undefined
			);
		} catch (error) {
			this.logger?.error(
				`[GeminiAiCategorizer] Gemini call failed: ${String(error)}`,
			);
			return undefined;
		}
	}

	private buildCategorizationPrompt(productName: string): string {
		const categories = Object.values(ProductCategory).join(", ");
		return (
			`You are a supermarket product categorizer for a Spanish supermarket. ` +
			`Given the following product name in Spanish, classify it into exactly one of these categories: ${categories}. ` +
			`Reply with ONLY the category value, nothing else.\n\n` +
			`${CATEGORY_DEFINITIONS}\n\n` +
			`Product: "${productName}"`
		);
	}
}
