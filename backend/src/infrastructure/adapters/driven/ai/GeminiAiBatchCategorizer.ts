import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProductCategory } from "@domain/entities/IProduct";
import type { AiBatchCategorizer } from "@application/ports/outgoing/AiBatchCategorizer";
import { CATEGORY_DEFINITIONS } from "./categoryPromptDefinitions";

interface GeminiLikeModel {
	generateContent(prompt: string): Promise<{ response: { text(): string } }>;
}

export interface GeminiBatchClient {
	getGenerativeModel(opts: { model: string }): GeminiLikeModel;
}

export interface GeminiAiBatchCategorizerDeps {
	apiKey: string;
	model: string;
	logger?: {
		warn(message: string): void;
		error(message: string): void;
	};
	clientFactory?: (apiKey: string) => GeminiBatchClient;
}

export class GeminiAiBatchCategorizer implements AiBatchCategorizer {
	private readonly apiKey: string;
	private readonly model: string;
	private readonly logger?: {
		warn(message: string): void;
		error(message: string): void;
	};
	private readonly clientFactory: (apiKey: string) => GeminiBatchClient;

	constructor(deps: GeminiAiBatchCategorizerDeps) {
		this.apiKey = deps.apiKey;
		this.model = deps.model;
		this.logger = deps.logger;
		this.clientFactory =
			deps.clientFactory ??
			((apiKey) => new GoogleGenerativeAI(apiKey) as unknown as GeminiBatchClient);
	}

	async categorizeBatch(productNames: string[]): Promise<Map<string, string>> {
		if (!this.apiKey) {
			this.logger?.warn(
				"[GeminiAiBatchCategorizer] GEMINI_API_KEY not set, skipping batch categorization.",
			);
			return new Map();
		}

		if (productNames.length === 0) {
			return new Map();
		}

		try {
			const client = this.clientFactory(this.apiKey);
			const geminiModel = client.getGenerativeModel({ model: this.model });
			const prompt = this.buildBatchPrompt(productNames);

			const result = await geminiModel.generateContent(prompt);
			const rawResponse = result.response.text();

			return this.parseAndValidateResponse(rawResponse, productNames);
		} catch (error) {
			this.logger?.error(
				`[GeminiAiBatchCategorizer] Batch Gemini call failed: ${String(error)}`,
			);
			return new Map();
		}
	}

	private buildBatchPrompt(productNames: string[]): string {
		const categories = Object.values(ProductCategory).join(", ");
		const namesList = productNames
			.map((name, index) => `${index + 1}. "${name}"`)
			.join("\n");

		return (
			`You are a supermarket product categorizer for a Spanish supermarket. ` +
			`Given the following product names in Spanish, classify each into exactly one of these categories: ${categories}.\n\n` +
			`${CATEGORY_DEFINITIONS}\n\n` +
			`Return a JSON object where each key is the exact product name and the value is its category. ` +
			`Reply with ONLY the JSON object, no markdown fences, no explanation.\n\n` +
			`Products to categorize:\n${namesList}`
		);
	}

	private parseAndValidateResponse(
		rawResponse: string,
		originalNames: string[],
	): Map<string, string> {
		const cleanedResponse = this.stripMarkdownFences(rawResponse);
		const validCategories = new Set(Object.values(ProductCategory) as string[]);
		const originalNamesSet = new Set(originalNames);
		const results = new Map<string, string>();

		let parsed: unknown;
		try {
			parsed = JSON.parse(cleanedResponse);
		} catch {
			this.logger?.error(
				`[GeminiAiBatchCategorizer] Failed to parse JSON response: ${cleanedResponse.slice(0, 200)}`,
			);
			return results;
		}

		if (!this.isValidResponseStructure(parsed)) {
			this.logger?.error(
				"[GeminiAiBatchCategorizer] Response is not a JSON object.",
			);
			return results;
		}

		for (const [name, rawCategory] of Object.entries(parsed)) {
			const entry = this.extractValidCategoryEntry(
				name,
				rawCategory,
				validCategories,
				originalNamesSet,
			);
			if (entry !== null) {
				results.set(entry[0], entry[1]);
			}
		}

		return results;
	}

	private isValidResponseStructure(
		parsed: unknown,
	): parsed is Record<string, unknown> {
		return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
	}

	private extractValidCategoryEntry(
		name: string,
		rawCategory: unknown,
		validCategories: Set<string>,
		originalNames: Set<string>,
	): [string, string] | null {
		if (!originalNames.has(name)) {
			this.logger?.warn(
				`[GeminiAiBatchCategorizer] Response contains unexpected product name: "${name}" — skipping.`,
			);
			return null;
		}

		if (typeof rawCategory !== "string" || !validCategories.has(rawCategory)) {
			this.logger?.warn(
				`[GeminiAiBatchCategorizer] Invalid category "${String(rawCategory)}" for product "${name}" — skipping.`,
			);
			return null;
		}

		return [name, rawCategory];
	}

	private stripMarkdownFences(text: string): string {
		return text
			.replace(/^```(?:json)?\s*/i, "")
			.replace(/\s*```\s*$/, "")
			.trim();
	}
}
