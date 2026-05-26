import { config } from "../config";
import { logger } from "./logger";
import { ProductCategorizationUseCase } from "../application/use-cases/categorization/ProductCategorizationUseCase";
import { GeminiAiCategorizer } from "../infrastructure/adapters/driven/ai/GeminiAiCategorizer";
import { JsonKeywordCategorizer } from "../infrastructure/adapters/driven/categorization/JsonKeywordCategorizer";

function createCategorizationUseCase(): ProductCategorizationUseCase {
	const keywordCategorizer = new JsonKeywordCategorizer();
	const aiCategorizer = new GeminiAiCategorizer({
		apiKey: config.geminiApiKey,
		model: config.geminiModel,
		logger,
	});

	return new ProductCategorizationUseCase({
		keywordCategorizer,
		aiCategorizer,
		logger,
		aiTimeoutMs: 1500,
	});
}

/**
 * Backward-compatible facade used by current scrapers.
 * Composition is explicit and stateless: no mutable global caches/singletons.
 */
export async function categorize(productName: string) {
	const useCase = createCategorizationUseCase();
	return useCase.execute(productName);
}
