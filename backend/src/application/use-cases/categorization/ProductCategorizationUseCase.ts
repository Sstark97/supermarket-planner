import { ProductCategory } from "@domain/entities/IProduct";
import { ProductNameNormalizer } from "@domain/services/ProductNameNormalizer";
import type { KeywordCategorizer } from "@application/ports/outgoing/KeywordCategorizer";
import type { AiCategorizer } from "@application/ports/outgoing/AiCategorizer";
import type { CategoryCacheRepository } from "@application/ports/outgoing/CategoryCacheRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";

export interface ProductCategorizationUseCaseDeps {
	keywordCategorizer: KeywordCategorizer;
	aiCategorizer?: AiCategorizer;
	categoryCache?: CategoryCacheRepository;
	aiTimeoutMs?: number;
	logger?: LoggerPort;
}

export class ProductCategorizationUseCase {
	private readonly keywordCategorizer: KeywordCategorizer;
	private readonly aiCategorizer?: AiCategorizer;
	private readonly categoryCache?: CategoryCacheRepository;
	private readonly aiTimeoutMs: number;
	private readonly logger?: LoggerPort;

	constructor(deps: ProductCategorizationUseCaseDeps) {
		this.keywordCategorizer = deps.keywordCategorizer;
		this.aiCategorizer = deps.aiCategorizer;
		this.categoryCache = deps.categoryCache;
		this.aiTimeoutMs = deps.aiTimeoutMs ?? 1500;
		this.logger = deps.logger;
	}

	async execute(productName: string): Promise<ProductCategory> {
		const normalizedName = ProductNameNormalizer.normalize(productName);

		const cachedCategory = await this.lookupInCache(normalizedName);
		if (cachedCategory !== undefined) {
			return cachedCategory;
		}

		const keywordCategory = this.keywordCategorizer.match(productName);
		if (keywordCategory !== undefined) {
			await this.writeThroughToCache(normalizedName, keywordCategory);
			return keywordCategory;
		}

		if (!this.aiCategorizer) {
			return ProductCategory.OTHER;
		}

		try {
			const aiCategory = await this.withTimeout(
				this.aiCategorizer.categorize(productName),
				this.aiTimeoutMs,
			);
			if (aiCategory !== undefined) {
				await this.writeThroughToCache(normalizedName, aiCategory);
				return aiCategory;
			}
			return ProductCategory.OTHER;
		} catch (error) {
			this.logger?.error(
				`[ProductCategorizationUseCase] AI fallback failed: ${String(error)}`,
			);
			return ProductCategory.OTHER;
		}
	}

	private async lookupInCache(
		normalizedName: string,
	): Promise<ProductCategory | undefined> {
		if (!this.categoryCache) {
			return undefined;
		}

		try {
			const cached = await this.categoryCache.findByNormalizedName(normalizedName);
			if (cached === undefined) {
				return undefined;
			}

			const matchedCategory = Object.values(ProductCategory).find(
				(cat) => cat === cached,
			);
			return matchedCategory;
		} catch (error) {
			this.logger?.warn(
				`[ProductCategorizationUseCase] Cache lookup failed, falling through: ${String(error)}`,
			);
			return undefined;
		}
	}

	private async writeThroughToCache(
		normalizedName: string,
		category: ProductCategory,
	): Promise<void> {
		if (!this.categoryCache) {
			return;
		}

		try {
			await this.categoryCache.upsertMany([{ normalizedName, category }]);
		} catch (error) {
			this.logger?.warn(
				`[ProductCategorizationUseCase] Cache write-through failed: ${String(error)}`,
			);
		}
	}

	private async withTimeout<T>(
		promise: Promise<T>,
		timeoutMs: number,
	): Promise<T> {
		let timer: NodeJS.Timeout | undefined;

		try {
			return await Promise.race([
				promise,
				new Promise<T>((_resolve, reject) => {
					timer = setTimeout(() => {
						reject(new Error(`AI categorization timeout after ${timeoutMs}ms`));
					}, timeoutMs);
				}),
			]);
		} finally {
			if (timer) {
				clearTimeout(timer);
			}
		}
	}
}
