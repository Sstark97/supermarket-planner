import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductMapper } from "../../domain/services/ProductMappingPolicy";
import { ProductCategory } from "../../interfaces/IProduct";
import { categorize } from "../../utils/ProductCategorizer";
import { mapMercadonaProducts } from "./MercadonaMapper";
import type { MercadonaApiProduct } from "./types";

vi.mock("../../utils/ProductCategorizer", () => ({
	categorize: vi.fn(async (productName: string) => {
		const normalized = productName.toLowerCase();
		if (normalized.includes("leche")) return ProductCategory.DAIRY;
		if (normalized.includes("tomate")) return ProductCategory.FRUITS_VEG;
		if (normalized.includes("arroz")) return ProductCategory.CEREALS_PASTA;
		if (normalized.includes("pan")) return ProductCategory.BAKERY;
		return ProductCategory.OTHER;
	}),
}));

function createTestProductMapper(id: string, nowIso: string): ProductMapper {
	return new ProductMapper({
		createId: () => id,
		nowIso: () => nowIso,
	});
}

describe("MercadonaMapper", () => {
	const nowIso = "2026-01-01T10:00:00.000Z";
	const categorizeMock = vi.mocked(categorize);

	beforeEach(() => {
		categorizeMock.mockClear();
	});

	it("maps display_name, thumbnail, id URL, category and tax type", async () => {
		const products: MercadonaApiProduct[] = [
			{
				id: "12345",
				display_name: "Leche entera",
				thumbnail: "https://img/123.jpg",
				price_instructions: {
					unit_price: 1.59,
					unit_size: 1,
					size_format: "L",
				},
			},
		];

		const mapped = await mapMercadonaProducts(products, {
			productMapper: createTestProductMapper("fixed-id", nowIso),
			supermarketName: "Mercadona",
		});

		expect(mapped).toHaveLength(1);
		expect(mapped[0]).toMatchObject({
			id: "fixed-id",
			name: "Leche entera",
			supermarket: "Mercadona",
			category: ProductCategory.DAIRY,
			image: "https://img/123.jpg",
			url: "https://tienda.mercadona.es/product/12345",
			taxType: "IGIC",
			scrapedAt: nowIso,
		});
		expect(categorizeMock).toHaveBeenCalledWith("Leche entera");
	});

	it("prefers price_instructions.unit_price over bulk_price", async () => {
		const mapped = await mapMercadonaProducts(
			[
				{
					id: "10",
					display_name: "Tomate pera",
					price_instructions: {
						unit_price: 3,
						bulk_price: 7,
						unit_size: 1,
						size_format: "kg",
					},
				},
			],
			{
				productMapper: createTestProductMapper("id-1", nowIso),
			},
		);

		expect(mapped[0].price).toBe(3);
	});

	it("falls back to bulk_price when unit_price is missing", async () => {
		const mapped = await mapMercadonaProducts(
			[
				{
					id: "11",
					display_name: "Arroz",
					price_instructions: {
						bulk_price: 2.5,
						unit_size: 1,
						size_format: "kg",
					},
				},
			],
			{
				productMapper: createTestProductMapper("id-2", nowIso),
			},
		);

		expect(mapped[0].price).toBe(2.5);
	});

	it("defaults quantity/unit to 1 ud when size fields are missing", async () => {
		const mapped = await mapMercadonaProducts(
			[
				{
					id: "12",
					display_name: "Pan rústico",
					price_instructions: {
						unit_price: 1.2,
					},
				},
			],
			{
				productMapper: createTestProductMapper("id-3", nowIso),
			},
		);

		expect(mapped[0].unit).toBe("ud");
		expect(mapped[0].pricePerUnit).toBe(1.2);
	});
});
