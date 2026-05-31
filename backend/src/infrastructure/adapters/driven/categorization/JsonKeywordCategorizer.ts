import type { ProductCategory } from "@domain/entities/IProduct";
import type { KeywordCategorizer } from "@application/ports/outgoing/KeywordCategorizer";
import keywordMapJson from "@infrastructure/config/category-keywords.json";

type KeywordRules = Record<string, ProductCategory>;

export class JsonKeywordCategorizer implements KeywordCategorizer {
	private readonly keywordMap: ReadonlyMap<string, ProductCategory>;

	constructor(keywordRules: KeywordRules = keywordMapJson as KeywordRules) {
		this.keywordMap = new Map(Object.entries(keywordRules));
	}

	match(productName: string): ProductCategory | undefined {
		const tokens = this.tokenize(productName);
		for (const token of tokens) {
			const category = this.keywordMap.get(token);
			if (category) {
				return category;
			}
		}

		return undefined;
	}

	private tokenize(text: string): string[] {
		const normalized = this.normalizeText(text);
		if (!normalized) return [];
		return normalized.split(" ");
	}

	private normalizeText(text: string): string {
		return text
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9\s]/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
}
