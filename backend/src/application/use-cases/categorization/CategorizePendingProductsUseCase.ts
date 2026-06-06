import { ProductCategory } from "@domain/entities/IProduct";
import { ProductNameNormalizer } from "@domain/services/ProductNameNormalizer";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { CategoryCacheRepository } from "@application/ports/outgoing/CategoryCacheRepository";
import type { AiBatchCategorizer } from "@application/ports/outgoing/AiBatchCategorizer";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";

export interface CategorizePendingProductsResult {
	totalPending: number;
	categorized: number;
	failed: number;
}

export interface CategorizePendingProductsUseCaseDeps {
	productCatalogRepository: ProductCatalogRepository;
	categoryCacheRepository: CategoryCacheRepository;
	aiBatchCategorizer: AiBatchCategorizer;
	logger: LoggerPort;
	batchSize?: number;
	batchDelayMs?: number;
}

export class CategorizePendingProductsUseCase {
	private readonly productCatalogRepository: ProductCatalogRepository;
	private readonly categoryCacheRepository: CategoryCacheRepository;
	private readonly aiBatchCategorizer: AiBatchCategorizer;
	private readonly logger: LoggerPort;
	private readonly batchSize: number;
	private readonly batchDelayMs: number;

	constructor(deps: CategorizePendingProductsUseCaseDeps) {
		this.productCatalogRepository = deps.productCatalogRepository;
		this.categoryCacheRepository = deps.categoryCacheRepository;
		this.aiBatchCategorizer = deps.aiBatchCategorizer;
		this.logger = deps.logger;
		this.batchSize = deps.batchSize ?? 50;
		this.batchDelayMs = deps.batchDelayMs ?? 7000;
	}

	async execute(): Promise<CategorizePendingProductsResult> {
		const pendingProducts = await this.productCatalogRepository.findByCategory(
			ProductCategory.OTHER,
		);

		if (pendingProducts.length === 0) {
			this.logger.info("[CategorizePendingProductsUseCase] No pending products found.");
			return { totalPending: 0, categorized: 0, failed: 0 };
		}

		this.logger.info(
			`[CategorizePendingProductsUseCase] Found ${pendingProducts.length} pending products.`,
		);

		const uniqueNormalizedNames = this.deduplicateNormalizedNames(
			pendingProducts.map((p) => p.name),
		);

		const alreadyCachedNames = await this.categoryCacheRepository.findByNormalizedNames(
			uniqueNormalizedNames,
		);

		const namesToCategorize = uniqueNormalizedNames.filter(
			(name) => !alreadyCachedNames.has(name),
		);

		const allCategoryResults = new Map<string, string>(alreadyCachedNames);
		let failed = 0;

		if (namesToCategorize.length > 0) {
			const batches = this.chunk(namesToCategorize, this.batchSize);
			this.logger.info(
				`[CategorizePendingProductsUseCase] Categorizing ${namesToCategorize.length} uncached names in ${batches.length} batch(es).`,
			);

			for (const [batchIndex, batch] of batches.entries()) {
				if (batchIndex > 0) {
					await this.delay(this.batchDelayMs);
				}
				const batchResults = await this.aiBatchCategorizer.categorizeBatch(batch);

				await this.persistBatchResultsToCache(batchResults);
				this.accumulateCategoryResults(batchResults, allCategoryResults);

				const uncategorizedInBatch = batch.length - batchResults.size;
				failed += uncategorizedInBatch;
			}
		}

		const updates = Array.from(allCategoryResults.entries()).map(
			([normalizedName, category]) => ({ normalizedName, category }),
		);

		const categorized = await this.productCatalogRepository.updateCategoryByNormalizedNames(
			updates,
		);

		this.logger.info(
			`[CategorizePendingProductsUseCase] Updated ${categorized} product rows. Failed: ${failed}.`,
		);

		return {
			totalPending: pendingProducts.length,
			categorized,
			failed,
		};
	}

	private async persistBatchResultsToCache(
		batchResults: Map<string, string>,
	): Promise<void> {
		const cacheEntries = Array.from(batchResults.entries()).map(
			([normalizedName, category]) => ({ normalizedName, category }),
		);

		if (cacheEntries.length > 0) {
			await this.categoryCacheRepository.upsertMany(cacheEntries);
		}
	}

	private accumulateCategoryResults(
		batchResults: Map<string, string>,
		allCategoryResults: Map<string, string>,
	): void {
		for (const [name, category] of batchResults.entries()) {
			allCategoryResults.set(name, category);
		}
	}

	private deduplicateNormalizedNames(productNames: string[]): string[] {
		const seen = new Set<string>();
		for (const name of productNames) {
			seen.add(ProductNameNormalizer.normalize(name));
		}
		return Array.from(seen);
	}

	private chunk<T>(items: T[], size: number): T[][] {
		const chunks: T[][] = [];
		for (let offset = 0; offset < items.length; offset += size) {
			chunks.push(items.slice(offset, offset + size));
		}
		return chunks;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
