import { describe, expect, it, vi } from "vitest";
import type { ProductCatalogRepository } from "../../ports/outgoing/ProductCatalogRepository";
import type { BackgroundRefreshQueuePort } from "../../ports/outgoing/BackgroundRefreshQueuePort";
import { ProductCategory, type IProduct } from "../../../interfaces/IProduct";
import { SearchProductsUseCase } from "./SearchProductsUseCase";

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
	};

	const backgroundRefreshQueue: BackgroundRefreshQueuePort = {
		enqueue: vi.fn().mockReturnValue(queueEnqueueResult),
	};

	return {
		useCase: new SearchProductsUseCase(
			productCatalogRepository,
			backgroundRefreshQueue,
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
			makeProduct({ supermarket: "Lidl", pricePerUnit: 2.4 }),
			makeProduct({ supermarket: "Aldi", pricePerUnit: 1.2 }),
			makeProduct({ supermarket: "Carrefour", pricePerUnit: 1.9 }),
		];

		const { useCase } = buildUseCase(products);
		const result = await useCase.execute({
			query: "leche",
			sortBy: "price_desc",
		});

		expect(result.results.map((product) => product.pricePerUnit)).toEqual([
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

		expect(backgroundRefreshQueue.enqueue).toHaveBeenCalledWith("leche");
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
