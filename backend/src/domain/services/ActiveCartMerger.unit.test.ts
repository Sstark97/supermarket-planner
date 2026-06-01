import { describe, it, expect } from "vitest";
import { ActiveCartMerger } from "./ActiveCartMerger";
import type { ActiveCartItem } from "@domain/entities/ActiveCart";

const makeItem = (overrides: Partial<ActiveCartItem> = {}): ActiveCartItem => ({
	productId: "prod-uuid-1",
	productName: "Leche Entera",
	supermarket: "mercadona",
	category: "dairy",
	price: 1.05,
	pricePerUnit: 1.05,
	unit: "l",
	taxType: "IGIC",
	quantity: 1,
	...overrides,
});

describe("ActiveCartMerger", () => {
	it("should return incoming items when existing items are empty", () => {
		const incoming = [makeItem({ quantity: 2 })];

		const result = ActiveCartMerger.merge([], incoming);

		expect(result).toHaveLength(1);
		expect(result[0].quantity).toBe(2);
	});

	it("should return existing items when incoming items are empty", () => {
		const existing = [makeItem({ quantity: 3 })];

		const result = ActiveCartMerger.merge(existing, []);

		expect(result).toHaveLength(1);
		expect(result[0].quantity).toBe(3);
	});

	it("should return an empty array when both existing and incoming are empty", () => {
		const result = ActiveCartMerger.merge([], []);

		expect(result).toHaveLength(0);
	});

	it("should replace existing quantity with incoming quantity for matching composite key", () => {
		const existing = [makeItem({ quantity: 5 })];
		const incoming = [makeItem({ quantity: 2 })];

		const result = ActiveCartMerger.merge(existing, incoming);

		expect(result).toHaveLength(1);
		expect(result[0].quantity).toBe(2);
	});

	it("should append incoming items that do not match any existing item", () => {
		const existing = [makeItem({ productName: "Leche Entera", supermarket: "mercadona" })];
		const incoming = [makeItem({ productName: "Pan Integral", supermarket: "lidl" })];

		const result = ActiveCartMerger.merge(existing, incoming);

		expect(result).toHaveLength(2);
		const names = result.map((item) => item.productName);
		expect(names).toContain("Leche Entera");
		expect(names).toContain("Pan Integral");
	});

	it("should distinguish items with the same productName but different supermarkets", () => {
		const existing = [makeItem({ productName: "Leche Entera", supermarket: "mercadona", quantity: 1 })];
		const incoming = [makeItem({ productName: "Leche Entera", supermarket: "aldi", quantity: 3 })];

		const result = ActiveCartMerger.merge(existing, incoming);

		expect(result).toHaveLength(2);
		const mercadonaItem = result.find((item) => item.supermarket === "mercadona");
		const aldiItem = result.find((item) => item.supermarket === "aldi");
		expect(mercadonaItem?.quantity).toBe(1);
		expect(aldiItem?.quantity).toBe(3);
	});

	it("should distinguish items with the same supermarket but different productNames", () => {
		const existing = [makeItem({ productName: "Leche Entera", supermarket: "mercadona", quantity: 2 })];
		const incoming = [makeItem({ productName: "Leche Semidesnatada", supermarket: "mercadona", quantity: 4 })];

		const result = ActiveCartMerger.merge(existing, incoming);

		expect(result).toHaveLength(2);
	});

	it("should handle a mix of overlapping and new items correctly", () => {
		const existing = [
			makeItem({ productName: "Leche Entera", supermarket: "mercadona", quantity: 5 }),
			makeItem({ productName: "Pan Integral", supermarket: "lidl", quantity: 1 }),
		];
		const incoming = [
			makeItem({ productName: "Leche Entera", supermarket: "mercadona", quantity: 2 }),
			makeItem({ productName: "Huevos", supermarket: "aldi", quantity: 6 }),
		];

		const result = ActiveCartMerger.merge(existing, incoming);

		expect(result).toHaveLength(3);
		const lecheItem = result.find(
			(item) => item.productName === "Leche Entera" && item.supermarket === "mercadona",
		);
		expect(lecheItem?.quantity).toBe(2);
		const panItem = result.find((item) => item.productName === "Pan Integral");
		expect(panItem?.quantity).toBe(1);
		const huevosItem = result.find((item) => item.productName === "Huevos");
		expect(huevosItem?.quantity).toBe(6);
	});

	it("should preserve all item fields from the incoming item on a match", () => {
		const existing = [
			makeItem({
				productName: "Leche Entera",
				supermarket: "mercadona",
				price: 1.0,
				quantity: 3,
				image: "old-image.jpg",
			}),
		];
		const incoming = [
			makeItem({
				productName: "Leche Entera",
				supermarket: "mercadona",
				price: 1.1,
				quantity: 2,
				image: "new-image.jpg",
			}),
		];

		const result = ActiveCartMerger.merge(existing, incoming);

		expect(result).toHaveLength(1);
		expect(result[0].price).toBe(1.1);
		expect(result[0].quantity).toBe(2);
		expect(result[0].image).toBe("new-image.jpg");
	});
});
