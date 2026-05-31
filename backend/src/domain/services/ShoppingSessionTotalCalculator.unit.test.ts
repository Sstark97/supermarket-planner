import { describe, it, expect } from "vitest";
import { ShoppingSessionTotalCalculator } from "./ShoppingSessionTotalCalculator";

describe("ShoppingSessionTotalCalculator", () => {
	it("should return 0 for an empty items array", () => {
		const total = ShoppingSessionTotalCalculator.calculate([]);

		expect(total).toBe(0);
	});

	it("should calculate total for a single item with quantity 1", () => {
		const total = ShoppingSessionTotalCalculator.calculate([
			{ price: 2.5, quantity: 1 },
		]);

		expect(total).toBe(2.5);
	});

	it("should calculate total for a single item with quantity greater than 1", () => {
		const total = ShoppingSessionTotalCalculator.calculate([
			{ price: 2.5, quantity: 3 },
		]);

		expect(total).toBe(7.5);
	});

	it("should sum totals across multiple items with different quantities", () => {
		const total = ShoppingSessionTotalCalculator.calculate([
			{ price: 1.0, quantity: 2 },
			{ price: 3.5, quantity: 1 },
			{ price: 0.99, quantity: 4 },
		]);

		expect(total).toBe(9.46);
	});

	it("should round to 2 decimal places to avoid floating-point drift", () => {
		const total = ShoppingSessionTotalCalculator.calculate([
			{ price: 1.33, quantity: 3 },
		]);

		expect(total).toBe(3.99);
	});

	it("should handle large quantities without precision loss", () => {
		const total = ShoppingSessionTotalCalculator.calculate([
			{ price: 0.1, quantity: 10 },
		]);

		expect(total).toBe(1.0);
	});
});
