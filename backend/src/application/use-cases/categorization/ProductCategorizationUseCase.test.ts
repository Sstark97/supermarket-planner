import { describe, expect, it, vi } from "vitest";
import { ProductCategory } from "../../../interfaces/IProduct";
import type { AiCategorizer } from "../../ports/outgoing/AiCategorizer";
import type { KeywordCategorizer } from "../../ports/outgoing/KeywordCategorizer";
import { ProductCategorizationUseCase } from "./ProductCategorizationUseCase";

describe("ProductCategorizationUseCase", () => {
	it("returns keyword category without calling AI gateway", async () => {
		const keywordCategorizer: KeywordCategorizer = {
			match: vi.fn().mockReturnValue(ProductCategory.DAIRY),
		};
		const aiCategorizer: AiCategorizer = {
			categorize: vi.fn().mockResolvedValue(ProductCategory.OTHER),
		};
		const useCase = new ProductCategorizationUseCase({
			keywordCategorizer,
			aiCategorizer,
		});

		const category = await useCase.execute("Leche entera");

		expect(category).toBe(ProductCategory.DAIRY);
		expect(aiCategorizer.categorize).not.toHaveBeenCalled();
	});

	it("uses AI fallback when keyword has no match", async () => {
		const keywordCategorizer: KeywordCategorizer = {
			match: vi.fn().mockReturnValue(undefined),
		};
		const aiCategorizer: AiCategorizer = {
			categorize: vi.fn().mockResolvedValue(ProductCategory.CLEANING),
		};
		const useCase = new ProductCategorizationUseCase({
			keywordCategorizer,
			aiCategorizer,
		});

		const category = await useCase.execute("Producto sin keyword");

		expect(category).toBe(ProductCategory.CLEANING);
		expect(aiCategorizer.categorize).toHaveBeenCalledOnce();
	});

	it("returns OTHER when AI fails", async () => {
		const keywordCategorizer: KeywordCategorizer = {
			match: vi.fn().mockReturnValue(undefined),
		};
		const aiCategorizer: AiCategorizer = {
			categorize: vi.fn().mockRejectedValue(new Error("boom")),
		};
		const logger = { error: vi.fn() };
		const useCase = new ProductCategorizationUseCase({
			keywordCategorizer,
			aiCategorizer,
			logger,
		});

		const category = await useCase.execute("Producto sin keyword");

		expect(category).toBe(ProductCategory.OTHER);
		expect(logger.error).toHaveBeenCalledOnce();
	});

	it("returns OTHER when AI fallback times out", async () => {
		const keywordCategorizer: KeywordCategorizer = {
			match: vi.fn().mockReturnValue(undefined),
		};
		const aiCategorizer: AiCategorizer = {
			categorize: vi.fn(
				() => new Promise<ProductCategory | undefined>(() => undefined),
			),
		};
		const logger = { error: vi.fn() };
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
