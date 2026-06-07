import { describe, expect, it } from "vitest";
import { ProductCategory, type IProduct } from "@domain/entities/IProduct";
import {
	mapDomainProductToBaseUpsertPayload,
	mapDomainProductToPriceUpsertPayload,
	mapPrismaProductWithPriceToDomain,
	parsePrismaProductWithPriceRecord,
} from "./PrismaProductMapper";

const buildProduct = (overrides: Partial<IProduct> = {}): IProduct => ({
	id: overrides.id ?? "product-1",
	name: overrides.name ?? "Leche Entera",
	supermarket: overrides.supermarket ?? "mercadona",
	category: overrides.category ?? ProductCategory.DAIRY,
	price: overrides.price ?? 1.5,
	pricePerUnit: overrides.pricePerUnit ?? 1.5,
	unit: overrides.unit ?? "1 L",
	image: overrides.image,
	url: overrides.url,
	taxType: overrides.taxType ?? "IGIC",
	scrapedAt: overrides.scrapedAt ?? "2026-06-01T10:00:00.000Z",
});

describe("mapDomainProductToBaseUpsertPayload", () => {
	it("builds an upsert payload without any price field", () => {
		const product = buildProduct();

		const payload = mapDomainProductToBaseUpsertPayload(product);

		expect(payload.where.supermarket_sku.supermarket).toBe("mercadona");
		expect(payload.update).not.toHaveProperty("price");
		expect(payload.update).not.toHaveProperty("pricePerUnit");
		expect(payload.update).not.toHaveProperty("scrapedAt");
		expect(payload.create).not.toHaveProperty("price");
		expect(payload.create).not.toHaveProperty("pricePerUnit");
		expect(payload.create).not.toHaveProperty("scrapedAt");
		expect(payload.create.supermarket).toBe("mercadona");
	});
});

describe("mapDomainProductToPriceUpsertPayload", () => {
	it("builds a ProductPrice upsert payload keyed by productId and postalCode", () => {
		const product = buildProduct({ price: 2.35, pricePerUnit: 2.35 });

		const payload = mapDomainProductToPriceUpsertPayload(
			product,
			"prisma-product-id",
			"35001",
		);

		expect(payload.where.productId_postalCode).toEqual({
			productId: "prisma-product-id",
			postalCode: "35001",
		});
		expect(payload.update.price).toBe(2.35);
		expect(payload.update.pricePerUnit).toBe(2.35);
		expect(payload.update.scrapedAt).toEqual(new Date(product.scrapedAt));
		expect(payload.create).toMatchObject({
			price: 2.35,
			pricePerUnit: 2.35,
			postalCode: "35001",
			productId: "prisma-product-id",
		});
	});
});

describe("mapPrismaProductWithPriceToDomain", () => {
	it("flattens the joined Product + ProductPrice row back into an IProduct", () => {
		const parsedRow = parsePrismaProductWithPriceRecord({
			id: "product-1",
			name: "Leche Entera",
			supermarket: "mercadona",
			category: ProductCategory.DAIRY,
			unit: "1 L",
			image: null,
			url: null,
			taxType: "IGIC",
			prices: [
				{
					price: 1.49,
					pricePerUnit: 1.49,
					scrapedAt: new Date("2026-06-01T10:00:00.000Z"),
				},
			],
		});

		expect(parsedRow.success).toBe(true);
		if (!parsedRow.success) return;

		const product = mapPrismaProductWithPriceToDomain(parsedRow.data);

		expect(product).toEqual<IProduct>({
			id: "product-1",
			name: "Leche Entera",
			supermarket: "mercadona",
			category: ProductCategory.DAIRY,
			price: 1.49,
			pricePerUnit: 1.49,
			unit: "1 L",
			image: undefined,
			url: undefined,
			taxType: "IGIC",
			scrapedAt: "2026-06-01T10:00:00.000Z",
		});
	});

	it("rejects rows that carry no price for the requested postal code", () => {
		const parsedRow = parsePrismaProductWithPriceRecord({
			id: "product-1",
			name: "Leche Entera",
			supermarket: "mercadona",
			category: ProductCategory.DAIRY,
			unit: "1 L",
			image: null,
			url: null,
			taxType: "IGIC",
			prices: [],
		});

		expect(parsedRow.success).toBe(false);
	});
});
