import { describe, expect, it, vi } from "vitest";
import { ProductCategory } from "../../interfaces/IProduct";
import { mapMercadonaProducts } from "./MercadonaMapper";
import type { MercadonaApiProduct } from "./types";

describe("MercadonaMapper", () => {
	const nowIso = "2026-01-01T10:00:00.000Z";

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
			categorizeFn: vi.fn().mockResolvedValue(ProductCategory.DAIRY),
			uuidFn: () => "fixed-id",
			nowFn: () => nowIso,
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
				categorizeFn: vi.fn().mockResolvedValue(ProductCategory.FRUITS_VEG),
				uuidFn: () => "id-1",
				nowFn: () => nowIso,
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
				categorizeFn: vi.fn().mockResolvedValue(ProductCategory.CEREALS_PASTA),
				uuidFn: () => "id-2",
				nowFn: () => nowIso,
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
				categorizeFn: vi.fn().mockResolvedValue(ProductCategory.BAKERY),
				uuidFn: () => "id-3",
				nowFn: () => nowIso,
			},
		);

		expect(mapped[0].unit).toBe("ud");
		expect(mapped[0].pricePerUnit).toBe(1.2);
	});
});
