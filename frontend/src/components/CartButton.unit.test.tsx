import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProductCategory, type IProduct } from "@/types";
import { CartButton } from "./CartButton";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";

function buildProduct(
	id: string,
	supermarket: string,
	price: number,
): IProduct {
	return {
		id,
		supermarket,
		name: `${supermarket}-${id}`,
		category: ProductCategory.OTHER,
		price,
		pricePerUnit: price,
		unit: "ud",
		taxType: "IGIC",
		scrapedAt: new Date().toISOString(),
	};
}

describe("CartButton", () => {
	beforeEach(() => {
		useCartStore.setState(useCartStore.getInitialState(), true);
		useCartUiStore.setState(useCartUiStore.getInitialState(), true);
	});

	it("shows total items badge from cart store selector", () => {
		useCartStore.getState().addItem(buildProduct("1", "Carrefour", 2));
		useCartStore.getState().addItem(buildProduct("1", "Carrefour", 2));

		render(<CartButton />);

		expect(screen.getByText("2")).toBeTruthy();
	});

	it("opens cart UI store when clicked", () => {
		render(<CartButton />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(useCartUiStore.getState().isOpen).toBe(true);
	});
});
