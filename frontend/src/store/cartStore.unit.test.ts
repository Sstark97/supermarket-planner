import { beforeEach, describe, expect, it } from "vitest";
import { ProductCategory, type IProduct } from "@/types";
import { useCartStore } from "./cartStore";

function makeProduct(input: {
	id: string;
	supermarket: string;
	price: number;
	name?: string;
}): IProduct {
	return {
		id: input.id,
		supermarket: input.supermarket,
		price: input.price,
		name: input.name ?? `${input.supermarket} product ${input.id}`,
		category: ProductCategory.OTHER,
		pricePerUnit: input.price,
		unit: "ud",
		taxType: "IGIC",
		scrapedAt: new Date().toISOString(),
	};
}

describe("cartStore", () => {
	beforeEach(() => {
		useCartStore.setState(useCartStore.getInitialState(), true);
	});

	it("stores same product id from different supermarkets as separate items", () => {
		const sharedId = "same-id";
		const carrefourProduct = makeProduct({
			id: sharedId,
			supermarket: "Carrefour",
			price: 2,
		});
		const mercadonaProduct = makeProduct({
			id: sharedId,
			supermarket: "Mercadona",
			price: 3,
		});

		useCartStore.getState().addItem(carrefourProduct);
		useCartStore.getState().addItem(mercadonaProduct);

		const state = useCartStore.getState();
		expect(state.items).toHaveLength(2);
		expect(state.itemRegistry["Carrefour:same-id"]).toBeDefined();
		expect(state.itemRegistry["Mercadona:same-id"]).toBeDefined();
		expect(state.totalItems).toBe(2);
		expect(state.totalPrice).toBe(5);
	});

	it("precomputes totals when quantities change", () => {
		const product = makeProduct({
			id: "burger-1",
			supermarket: "Carrefour",
			price: 4,
		});

		const store = useCartStore.getState();
		store.addItem(product);
		store.addItem(product);
		store.updateQuantity("Carrefour:burger-1", 1);

		let state = useCartStore.getState();
		expect(state.totalItems).toBe(3);
		expect(state.totalPrice).toBe(12);

		state.updateQuantity("Carrefour:burger-1", -2);
		state = useCartStore.getState();
		expect(state.totalItems).toBe(1);
		expect(state.totalPrice).toBe(4);

		state.removeItem("Carrefour:burger-1");
		state = useCartStore.getState();
		expect(state.items).toHaveLength(0);
		expect(state.totalItems).toBe(0);
		expect(state.totalPrice).toBe(0);
	});
});
