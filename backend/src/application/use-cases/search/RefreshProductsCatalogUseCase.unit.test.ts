import { describe, expect, it, vi } from "vitest";
import type { TriggerManualScrapeUseCasePort } from "@application/ports/incoming/TriggerManualScrapeUseCasePort";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import { ProductCategory, type IProduct } from "@domain/entities/IProduct";
import type { SearchResult } from "./contracts";
import { RefreshProductsCatalogUseCase } from "./RefreshProductsCatalogUseCase";

const silentLogger: LoggerPort = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

const buildProduct = (): IProduct => ({
	id: "product-1",
	name: "Leche Entera",
	supermarket: "mercadona",
	category: ProductCategory.DAIRY,
	price: 1.5,
	pricePerUnit: 1.5,
	unit: "1 L",
	taxType: "IGIC",
	scrapedAt: new Date().toISOString(),
});

const buildSearchResult = (results: IProduct[]): SearchResult => ({
	query: "leche",
	results,
	warnings: [],
	totalCount: results.length,
	nextCursor: null,
	source: "live",
	scrapedAt: new Date().toISOString(),
});

describe("RefreshProductsCatalogUseCase.execute", () => {
	it("forwards the postal code from the input to the repository save call", async () => {
		const liveResults = [buildProduct()];
		const triggerManualScrapeHandler: TriggerManualScrapeUseCasePort = {
			execute: vi.fn().mockResolvedValue(buildSearchResult(liveResults)),
		};
		const productCatalogRepository: ProductCatalogRepository = {
			find: vi.fn().mockResolvedValue([]),
			save: vi.fn().mockResolvedValue(1),
			findByCategory: vi.fn().mockResolvedValue([]),
			updateCategoryByNormalizedNames: vi.fn().mockResolvedValue(0),
		};

		const useCase = new RefreshProductsCatalogUseCase(
			triggerManualScrapeHandler,
			productCatalogRepository,
			silentLogger,
		);

		await useCase.execute({ query: "leche", postalCode: "35001" });

		expect(triggerManualScrapeHandler.execute).toHaveBeenCalledWith({
			query: "leche",
			postalCode: "35001",
		});
		expect(productCatalogRepository.save).toHaveBeenCalledWith(
			liveResults,
			"35001",
		);
	});
});
