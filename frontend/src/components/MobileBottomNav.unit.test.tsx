import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileBottomNav } from "./MobileBottomNav";
import { useCartUiStore } from "@/store/cartUiStore";
import { useFilterUiStore } from "@/store/filterUiStore";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(() => "/"),
}));

describe("MobileBottomNav", () => {
	beforeEach(() => {
		useCartUiStore.setState(useCartUiStore.getInitialState(), true);
		useFilterUiStore.setState(useFilterUiStore.getInitialState(), true);
	});

	it("renders all four navigation items", () => {
		render(<MobileBottomNav />);

		expect(screen.getByText("Inicio")).toBeTruthy();
		expect(screen.getByText("Buscar")).toBeTruthy();
		expect(screen.getByText("Filtros")).toBeTruthy();
		expect(screen.getByText("Carrito")).toBeTruthy();
	});

	it("renders Home as a link to /", () => {
		render(<MobileBottomNav />);

		const homeLink = screen.getByRole("link", { name: "Inicio" });
		expect(homeLink.getAttribute("href")).toBe("/");
	});

	it("renders Search as a link to /?focus=search", () => {
		render(<MobileBottomNav />);

		const searchLink = screen.getByRole("link", { name: "Buscar" });
		expect(searchLink.getAttribute("href")).toBe("/?focus=search");
	});

	it("opens the filter drawer when Filters button is clicked", () => {
		render(<MobileBottomNav />);

		fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

		expect(useFilterUiStore.getState().isOpen).toBe(true);
	});

	it("opens the cart when Cart button is clicked", () => {
		render(<MobileBottomNav />);

		fireEvent.click(screen.getByRole("button", { name: "Carrito" }));

		expect(useCartUiStore.getState().isOpen).toBe(true);
	});
});
