import { ProductCategory } from "@domain/entities/IProduct";
import type { KeywordCategorizer } from "@application/ports/outgoing/KeywordCategorizer";
import keywordMapJson from "@infrastructure/config/category-keywords.json";
import phrasesJson from "@infrastructure/config/category-phrases.json";

type KeywordRules = Record<string, ProductCategory>;
type PhraseRules = Record<string, ProductCategory>;

const FROZEN_QUALIFIERS = new Set([
	"congelado", "congelada", "congelados", "congeladas",
	"ultracongelado", "ultracongelada", "ultracongelados", "ultracongeladas",
]);

export class JsonKeywordCategorizer implements KeywordCategorizer {
	private readonly keywordMap: ReadonlyMap<string, ProductCategory>;
	private readonly phraseEntries: ReadonlyArray<[string, ProductCategory]>;

	constructor(
		keywordRules: KeywordRules = keywordMapJson as KeywordRules,
		phraseRules: PhraseRules = phrasesJson as PhraseRules,
	) {
		this.keywordMap = new Map(Object.entries(keywordRules));
		// Sorted longest-first so more specific phrases win over shorter overlapping ones
		this.phraseEntries = Object.entries(phraseRules).sort(
			([a], [b]) => b.length - a.length,
		) as ReadonlyArray<[string, ProductCategory]>;
	}

	match(productName: string): ProductCategory | undefined {
		const normalized = this.normalizeText(productName);

		const phraseCategory = this.matchByPhrase(normalized);
		if (phraseCategory !== undefined) {
			return phraseCategory;
		}

		const frozenCategory = this.matchByFrozenQualifier(normalized);
		if (frozenCategory !== undefined) {
			return frozenCategory;
		}

		return this.matchByToken(normalized);
	}

	private matchByPhrase(normalized: string): ProductCategory | undefined {
		for (const [phrase, category] of this.phraseEntries) {
			if (normalized.includes(phrase)) {
				return category;
			}
		}
		return undefined;
	}

	private matchByFrozenQualifier(normalized: string): ProductCategory | undefined {
		const tokens = normalized.split(" ");
		const hasFrozenQualifier = tokens.some((token) => FROZEN_QUALIFIERS.has(token));
		return hasFrozenQualifier ? ProductCategory.FROZEN : undefined;
	}

	private matchByToken(normalized: string): ProductCategory | undefined {
		const tokens = normalized.split(" ");
		for (const token of tokens) {
			const category = this.keywordMap.get(token);
			if (category !== undefined) {
				return category;
			}
		}
		return undefined;
	}

	private normalizeText(text: string): string {
		return text
			.toLowerCase()
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.replace(/[^a-z0-9\s]/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
}
