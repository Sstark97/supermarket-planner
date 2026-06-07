import { describe, expect, it, vi } from "vitest";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { BackgroundRefreshQueuePort } from "@application/ports/outgoing/BackgroundRefreshQueuePort";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import { ProductCategory, type IProduct } from "@domain/entities/IProduct";
import { SearchProductsUseCase } from "./SearchProductsUseCase";

const silentLogger: LoggerPort = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

let productSequence = 0;

const makeProduct = (overrides: Partial<IProduct> = {}): IProduct => ({
	id: overrides.id ?? `product-${++productSequence}`,
	name: overrides.name ?? "Leche Entera",
	supermarket: overrides.supermarket ?? "Mercado Uno",
	category: overrides.category ?? ProductCategory.DAIRY,
	price: overrides.price ?? 1.5,
	pricePerUnit: overrides.pricePerUnit ?? 1.5,
	unit: overrides.unit ?? "1 L",
	image: overrides.image,
	url: overrides.url,
	taxType: overrides.taxType ?? "UNKNOWN",
	scrapedAt: overrides.scrapedAt ?? new Date().toISOString(),
});

function buildUseCase(
	products: IProduct[],
	queueEnqueueResult = true,
): {
	useCase: SearchProductsUseCase;
	productCatalogRepository: ProductCatalogRepository;
	backgroundRefreshQueue: BackgroundRefreshQueuePort;
} {
	const productCatalogRepository: ProductCatalogRepository = {
		find: vi.fn().mockResolvedValue(products),
		save: vi.fn().mockResolvedValue(0),
		findByCategory: vi.fn().mockResolvedValue([]),
		updateCategoryByNormalizedNames: vi.fn().mockResolvedValue(0),
	};

	const backgroundRefreshQueue: BackgroundRefreshQueuePort = {
		enqueue: vi.fn().mockReturnValue(queueEnqueueResult),
	};

	return {
		useCase: new SearchProductsUseCase(
			productCatalogRepository,
			backgroundRefreshQueue,
			silentLogger,
		),
		productCatalogRepository,
		backgroundRefreshQueue,
	};
}

describe("SearchProductsUseCase.execute", () => {
	it("deduplicates by supermarket and normalized name keeping cheapest pricePerUnit", async () => {
		const duplicatedProducts = [
			makeProduct({
				name: "Leche Entera",
				supermarket: "Lidl",
				pricePerUnit: 1.8,
			}),
			makeProduct({
				name: "LECHE   ENTERA!!!",
				supermarket: "Lidl",
				pricePerUnit: 1.2,
			}),
			makeProduct({
				name: "Leche Entera",
				supermarket: "Aldi",
				pricePerUnit: 1.1,
			}),
		];

		const { useCase } = buildUseCase(duplicatedProducts);
		const result = await useCase.execute({ query: "leche" });

		expect(result.results).toHaveLength(2);
		expect(
			result.results.find((product) => product.supermarket === "Lidl")
				?.pricePerUnit,
		).toBe(1.2);
	});

	it("sorts results by price descending when sortBy is price_desc", async () => {
		const products = [
			makeProduct({ supermarket: "Lidl", price: 2.4 }),
			makeProduct({ supermarket: "Aldi", price: 1.2 }),
			makeProduct({ supermarket: "Carrefour", price: 1.9 }),
		];

		const { useCase } = buildUseCase(products);
		const result = await useCase.execute({
			query: "leche",
			sortBy: "price_desc",
		});

		expect(result.results.map((product) => product.price)).toEqual([
			2.4, 1.9, 1.2,
		]);
	});

	it("does not trigger refresh when query is empty", async () => {
		const { useCase, backgroundRefreshQueue } = buildUseCase([]);
		const result = await useCase.execute({ query: "" });

		expect(backgroundRefreshQueue.enqueue).not.toHaveBeenCalled();
		expect(result.isRefreshing).toBeUndefined();
		expect(result.refreshReason).toBeUndefined();
	});

	it("marks refresh metadata when queue accepts refresh request", async () => {
		const { useCase, backgroundRefreshQueue } = buildUseCase([], true);
		const result = await useCase.execute({ query: "leche" });

		expect(backgroundRefreshQueue.enqueue).toHaveBeenCalledWith("leche", "35001");
		expect(result.isRefreshing).toBe(true);
		expect(result.refreshReason).toBe("empty");
	});

	it("does not expose refresh metadata when queue rejects refresh request", async () => {
		const { useCase } = buildUseCase([], false);
		const result = await useCase.execute({ query: "leche" });

		expect(result.isRefreshing).toBeUndefined();
		expect(result.refreshReason).toBeUndefined();
	});
});

describe("SearchProductsUseCase pagination", () => {
	function makeDistinctProducts(count: number): IProduct[] {
		return Array.from({ length: count }, (_, index) =>
			makeProduct({
				name: `Product ${index + 1}`,
				supermarket: `Store ${index + 1}`,
				price: index + 1,
				pricePerUnit: index + 1,
			}),
		);
	}

	it("should return first 20 products and nextCursor when no cursor is provided", async () => {
		const products = makeDistinctProducts(35);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product" });

		expect(result.results).toHaveLength(20);
		expect(result.nextCursor).toBe("20");
	});

	it("should return correct page slice when cursor is provided", async () => {
		const products = makeDistinctProducts(35);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product", cursor: "20" });

		expect(result.results).toHaveLength(15);
		expect(result.results[0].name).toBe("Product 21");
	});

	it("should return null nextCursor when on the last page", async () => {
		const products = makeDistinctProducts(20);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product" });

		expect(result.results).toHaveLength(20);
		expect(result.nextCursor).toBeNull();
	});

	it("should respect a custom limit parameter", async () => {
		const products = makeDistinctProducts(50);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product", limit: 10 });

		expect(result.results).toHaveLength(10);
		expect(result.nextCursor).toBe("10");
	});

	it("should cap limit at 100", async () => {
		const products = makeDistinctProducts(150);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product", limit: 200 });

		expect(result.results).toHaveLength(100);
		expect(result.nextCursor).toBe("100");
	});

	it("should set totalCount to the full deduplicated set size, not the page slice size", async () => {
		const products = makeDistinctProducts(35);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product", limit: 10 });

		expect(result.results).toHaveLength(10);
		expect(result.totalCount).toBe(35);
	});

	it("should treat a non-numeric cursor as offset 0", async () => {
		const products = makeDistinctProducts(30);
		const { useCase } = buildUseCase(products);

		const result = await useCase.execute({ query: "product", cursor: "abc" });

		expect(result.results).toHaveLength(20);
		expect(result.nextCursor).toBe("20");
	});
});
