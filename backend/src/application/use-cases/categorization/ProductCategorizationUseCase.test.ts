import { describe, expect, it, vi } from "vitest";
import { ProductCategory } from "@domain/entities/IProduct";
import type { AiCategorizer } from "@application/ports/outgoing/AiCategorizer";
import type { KeywordCategorizer } from "@application/ports/outgoing/KeywordCategorizer";
import type { CategoryCacheRepository } from "@application/ports/outgoing/CategoryCacheRepository";
import { ProductCategorizationUseCase } from "./ProductCategorizationUseCase";

function buildSilentLogger() {
	return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function buildKeywordCategorizerWithResult(
	result: ProductCategory | undefined,
): KeywordCategorizer {
	return { match: vi.fn().mockReturnValue(result) };
}

function buildAiCategorizerWithResult(
	result: ProductCategory | undefined,
): AiCategorizer {
	return { categorize: vi.fn().mockResolvedValue(result) };
}

function buildCacheWithResult(result: string | undefined): CategoryCacheRepository {
	return {
		findByNormalizedName: vi.fn().mockResolvedValue(result),
		findByNormalizedNames: vi.fn().mockResolvedValue(new Map()),
		upsertMany: vi.fn().mockResolvedValue(undefined),
	};
}

describe("ProductCategorizationUseCase", () => {
	describe("without cache (backward-compatible behavior)", () => {
		it("should return keyword category without calling the AI", async () => {
			const keywordCategorizer = buildKeywordCategorizerWithResult(
				ProductCategory.DAIRY,
			);
			const aiCategorizer = buildAiCategorizerWithResult(ProductCategory.OTHER);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
			});

			const category = await useCase.execute("Leche entera");

			expect(category).toBe(ProductCategory.DAIRY);
			expect(aiCategorizer.categorize).not.toHaveBeenCalled();
		});

		it("should use AI fallback when keyword has no match", async () => {
			const keywordCategorizer = buildKeywordCategorizerWithResult(undefined);
			const aiCategorizer = buildAiCategorizerWithResult(ProductCategory.CLEANING);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
			});

			const category = await useCase.execute("Producto sin keyword");

			expect(category).toBe(ProductCategory.CLEANING);
			expect(aiCategorizer.categorize).toHaveBeenCalledOnce();
		});

		it("should return OTHER when AI fails", async () => {
			const keywordCategorizer = buildKeywordCategorizerWithResult(undefined);
			const aiCategorizer: AiCategorizer = {
				categorize: vi.fn().mockRejectedValue(new Error("boom")),
			};
			const logger = buildSilentLogger();
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
				logger,
			});

			const category = await useCase.execute("Producto sin keyword");

			expect(category).toBe(ProductCategory.OTHER);
			expect(logger.error).toHaveBeenCalledOnce();
		});

		it("should return OTHER when AI fallback times out", async () => {
			const keywordCategorizer = buildKeywordCategorizerWithResult(undefined);
			const aiCategorizer: AiCategorizer = {
				categorize: vi.fn(
					() => new Promise<ProductCategory | undefined>(() => undefined),
				),
			};
			const logger = buildSilentLogger();
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
				logger,
				aiTimeoutMs: 5,
			});

			const category = await useCase.execute("Producto sin keyword");

			expect(category).toBe(ProductCategory.OTHER);
			expect(logger.error).toHaveBeenCalledOnce();
		});
	});

	describe("with cache — cache hit", () => {
		it("should return the cached category without calling keyword or AI", async () => {
			const cache = buildCacheWithResult(ProductCategory.FROZEN);
			const keywordCategorizer = buildKeywordCategorizerWithResult(
				ProductCategory.DAIRY,
			);
			const aiCategorizer = buildAiCategorizerWithResult(ProductCategory.SNACKS);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
				categoryCache: cache,
			});

			const category = await useCase.execute("Gambas congeladas");

			expect(category).toBe(ProductCategory.FROZEN);
			expect(keywordCategorizer.match).not.toHaveBeenCalled();
			expect(aiCategorizer.categorize).not.toHaveBeenCalled();
		});

		it("should normalize the product name before looking up in cache", async () => {
			const cache = buildCacheWithResult(ProductCategory.DAIRY);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer: buildKeywordCategorizerWithResult(undefined),
				categoryCache: cache,
			});

			await useCase.execute("Leche Entera");

			expect(cache.findByNormalizedName).toHaveBeenCalledWith("leche entera");
		});
	});

	describe("with cache — cache miss, keyword hit (write-through)", () => {
		it("should fall through to keyword and write the result to cache", async () => {
			const cache = buildCacheWithResult(undefined);
			const keywordCategorizer = buildKeywordCategorizerWithResult(
				ProductCategory.BAKERY,
			);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				categoryCache: cache,
			});

			const category = await useCase.execute("Pan integral");

			expect(category).toBe(ProductCategory.BAKERY);
			expect(cache.upsertMany).toHaveBeenCalledWith([
				{ normalizedName: "pan integral", category: ProductCategory.BAKERY },
			]);
		});
	});

	describe("with cache — cache miss, keyword miss, AI hit (write-through)", () => {
		it("should fall through to AI and write the result to cache", async () => {
			const cache = buildCacheWithResult(undefined);
			const keywordCategorizer = buildKeywordCategorizerWithResult(undefined);
			const aiCategorizer = buildAiCategorizerWithResult(ProductCategory.PET);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
				categoryCache: cache,
			});

			const category = await useCase.execute("Pienso premium gato");

			expect(category).toBe(ProductCategory.PET);
			expect(cache.upsertMany).toHaveBeenCalledWith([
				{
					normalizedName: "pienso premium gato",
					category: ProductCategory.PET,
				},
			]);
		});
	});

	describe("with cache — cache miss, keyword miss, AI returns undefined", () => {
		it("should return OTHER without writing to cache", async () => {
			const cache = buildCacheWithResult(undefined);
			const keywordCategorizer = buildKeywordCategorizerWithResult(undefined);
			const aiCategorizer = buildAiCategorizerWithResult(undefined);
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				aiCategorizer,
				categoryCache: cache,
			});

			const category = await useCase.execute("Unknown product xyz");

			expect(category).toBe(ProductCategory.OTHER);
			expect(cache.upsertMany).not.toHaveBeenCalled();
		});
	});

	describe("with cache — cache lookup failure is handled gracefully", () => {
		it("should fall through to keyword when the cache lookup throws", async () => {
			const cache: CategoryCacheRepository = {
				findByNormalizedName: vi
					.fn()
					.mockRejectedValue(new Error("DB connection lost")),
				findByNormalizedNames: vi.fn().mockResolvedValue(new Map()),
				upsertMany: vi.fn().mockResolvedValue(undefined),
			};
			const keywordCategorizer = buildKeywordCategorizerWithResult(
				ProductCategory.DRINKS,
			);
			const logger = buildSilentLogger();
			const useCase = new ProductCategorizationUseCase({
				keywordCategorizer,
				categoryCache: cache,
				logger,
			});

			const category = await useCase.execute("Cerveza");

			expect(category).toBe(ProductCategory.DRINKS);
			expect(logger.warn).toHaveBeenCalledOnce();
		});
	});
});
