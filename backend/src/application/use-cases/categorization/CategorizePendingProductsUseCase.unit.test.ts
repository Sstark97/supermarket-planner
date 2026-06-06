import { describe, expect, it, vi } from "vitest";
import { ProductCategory, type IProduct } from "@domain/entities/IProduct";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { CategoryCacheRepository } from "@application/ports/outgoing/CategoryCacheRepository";
import type { AiBatchCategorizer } from "@application/ports/outgoing/AiBatchCategorizer";
import { CategorizePendingProductsUseCase } from "./CategorizePendingProductsUseCase";

let productSequence = 0;

function makeOtherProduct(name: string): IProduct {
	return {
		id: `product-${++productSequence}`,
		name,
		supermarket: "TestMart",
		category: ProductCategory.OTHER,
		price: 1.0,
		pricePerUnit: 1.0,
		unit: "1 u",
		taxType: "UNKNOWN",
		scrapedAt: new Date().toISOString(),
	};
}

function buildSilentLogger() {
	return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function buildRepository(
	pendingProducts: IProduct[],
): ProductCatalogRepository {
	return {
		find: vi.fn().mockResolvedValue([]),
		save: vi.fn().mockResolvedValue(0),
		findByCategory: vi.fn().mockResolvedValue(pendingProducts),
		updateCategoryByNormalizedNames: vi.fn().mockResolvedValue(
			pendingProducts.length,
		),
	};
}

function buildCache(
	cachedNames: Map<string, string> = new Map(),
): CategoryCacheRepository {
	return {
		findByNormalizedName: vi.fn().mockResolvedValue(undefined),
		findByNormalizedNames: vi.fn().mockResolvedValue(cachedNames),
		upsertMany: vi.fn().mockResolvedValue(undefined),
	};
}

function buildBatchCategorizer(
	results: Map<string, string>,
): AiBatchCategorizer {
	return {
		categorizeBatch: vi.fn().mockResolvedValue(results),
	};
}

function buildUseCase(deps: {
	pendingProducts: IProduct[];
	cachedNames?: Map<string, string>;
	batchResults?: Map<string, string>;
	updateCount?: number;
	batchSize?: number;
	batchDelayMs?: number;
}) {
	const repository = buildRepository(deps.pendingProducts);
	(repository.updateCategoryByNormalizedNames as ReturnType<typeof vi.fn>).mockResolvedValue(
		deps.updateCount ?? deps.pendingProducts.length,
	);
	const cache = buildCache(deps.cachedNames ?? new Map());
	const batchResults =
		deps.batchResults ??
		new Map(
			[...new Set(deps.pendingProducts.map((p) => p.name.toLowerCase()))].map(
				(name) => [name, ProductCategory.SNACKS],
			),
		);
	const aiBatchCategorizer = buildBatchCategorizer(batchResults);
	const logger = buildSilentLogger();

	const useCase = new CategorizePendingProductsUseCase({
		productCatalogRepository: repository,
		categoryCacheRepository: cache,
		aiBatchCategorizer,
		logger,
		batchSize: deps.batchSize ?? 50,
		batchDelayMs: deps.batchDelayMs ?? 0,
	});

	return { useCase, repository, cache, aiBatchCategorizer, logger };
}

describe("CategorizePendingProductsUseCase", () => {
	describe("when there are no pending products", () => {
		it("should return zeros without calling the AI", async () => {
			const { useCase, aiBatchCategorizer } = buildUseCase({
				pendingProducts: [],
			});

			const result = await useCase.execute();

			expect(result).toEqual({ totalPending: 0, categorized: 0, failed: 0 });
			expect(aiBatchCategorizer.categorizeBatch).not.toHaveBeenCalled();
		});
	});

	describe("happy path", () => {
		it("should categorize pending products and return a summary with the count", async () => {
			const pending = [
				makeOtherProduct("Leche entera"),
				makeOtherProduct("Pan integral"),
			];
			const batchResults = new Map([
				["leche entera", ProductCategory.DAIRY],
				["pan integral", ProductCategory.BAKERY],
			]);
			const { useCase, repository } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 2,
			});

			const result = await useCase.execute();

			expect(result.totalPending).toBe(2);
			expect(result.categorized).toBe(2);
			expect(result.failed).toBe(0);
			expect(repository.updateCategoryByNormalizedNames).toHaveBeenCalledOnce();
		});

		it("should upsert AI results into the cache after a successful batch", async () => {
			const pending = [makeOtherProduct("Leche entera")];
			const batchResults = new Map([["leche entera", ProductCategory.DAIRY]]);
			const { useCase, cache } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 1,
			});

			await useCase.execute();

			expect(cache.upsertMany).toHaveBeenCalledWith([
				{ normalizedName: "leche entera", category: ProductCategory.DAIRY },
			]);
		});
	});

	describe("deduplication of normalized names", () => {
		it("should deduplicate product names before calling the AI", async () => {
			const pending = [
				makeOtherProduct("Leche Entera"),
				makeOtherProduct("LECHE ENTERA"),
				makeOtherProduct("leche entera"),
			];
			const batchResults = new Map([["leche entera", ProductCategory.DAIRY]]);
			const { useCase, aiBatchCategorizer } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 3,
			});

			await useCase.execute();

			expect(aiBatchCategorizer.categorizeBatch).toHaveBeenCalledWith([
				"leche entera",
			]);
		});

		it("should report total pending as the raw product count, not the deduplicated count", async () => {
			const pending = [
				makeOtherProduct("Leche Entera"),
				makeOtherProduct("LECHE ENTERA"),
			];
			const batchResults = new Map([["leche entera", ProductCategory.DAIRY]]);
			const { useCase } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 2,
			});

			const result = await useCase.execute();

			expect(result.totalPending).toBe(2);
		});
	});

	describe("cache pre-filtering", () => {
		it("should skip names already present in the cache and not send them to AI", async () => {
			const pending = [
				makeOtherProduct("leche entera"),
				makeOtherProduct("pan integral"),
			];
			const alreadyCached = new Map([["leche entera", ProductCategory.DAIRY]]);
			const batchResults = new Map([["pan integral", ProductCategory.BAKERY]]);
			const { useCase, aiBatchCategorizer } = buildUseCase({
				pendingProducts: pending,
				cachedNames: alreadyCached,
				batchResults,
				updateCount: 2,
			});

			await useCase.execute();

			expect(aiBatchCategorizer.categorizeBatch).toHaveBeenCalledWith([
				"pan integral",
			]);
		});

		it("should skip the AI call entirely when all names are already cached", async () => {
			const pending = [makeOtherProduct("leche entera")];
			const alreadyCached = new Map([["leche entera", ProductCategory.DAIRY]]);
			const { useCase, aiBatchCategorizer } = buildUseCase({
				pendingProducts: pending,
				cachedNames: alreadyCached,
				updateCount: 1,
			});

			await useCase.execute();

			expect(aiBatchCategorizer.categorizeBatch).not.toHaveBeenCalled();
		});
	});

	describe("batch chunking", () => {
		it("should split names into batches of the configured size", async () => {
			const batchSize = 3;
			const names = ["p1", "p2", "p3", "p4", "p5"];
			const pending = names.map(makeOtherProduct);

			const batchResults = new Map(
				names.map((name) => [name, ProductCategory.SNACKS]),
			);
			const { useCase, aiBatchCategorizer } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 5,
				batchSize,
			});

			await useCase.execute();

			expect(aiBatchCategorizer.categorizeBatch).toHaveBeenCalledTimes(2);
			expect(
				(aiBatchCategorizer.categorizeBatch as ReturnType<typeof vi.fn>).mock
					.calls[0][0],
			).toHaveLength(3);
			expect(
				(aiBatchCategorizer.categorizeBatch as ReturnType<typeof vi.fn>).mock
					.calls[1][0],
			).toHaveLength(2);
		});

		it("should call AI exactly once when products fit in a single batch", async () => {
			const pending = Array.from({ length: 5 }, (_, i) =>
				makeOtherProduct(`product-${i}`),
			);
			const batchResults = new Map(
				pending.map((p) => [p.name, ProductCategory.SNACKS]),
			);
			const { useCase, aiBatchCategorizer } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 5,
				batchSize: 50,
			});

			await useCase.execute();

			expect(aiBatchCategorizer.categorizeBatch).toHaveBeenCalledTimes(1);
		});
	});

	describe("partial AI failure", () => {
		it("should count names not returned by AI as failed", async () => {
			const pending = [
				makeOtherProduct("leche entera"),
				makeOtherProduct("pan integral"),
				makeOtherProduct("producto raro xyz"),
			];
			// AI only categorizes 2 of 3 names
			const batchResults = new Map([
				["leche entera", ProductCategory.DAIRY],
				["pan integral", ProductCategory.BAKERY],
			]);
			const { useCase } = buildUseCase({
				pendingProducts: pending,
				batchResults,
				updateCount: 2,
			});

			const result = await useCase.execute();

			expect(result.failed).toBe(1);
		});
	});
});
