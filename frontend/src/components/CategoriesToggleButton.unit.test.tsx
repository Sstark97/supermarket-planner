import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CategoriesToggleButton } from "./CategoriesToggleButton";
import { useCategoryUiStore } from "@/store/categoryUiStore";

describe("CategoriesToggleButton", () => {
	beforeEach(() => {
		useCategoryUiStore.setState(useCategoryUiStore.getInitialState(), true);
	});

	it("should render with active style when categories are visible", () => {
		render(<CategoriesToggleButton />);

		const button = screen.getByRole("button", { name: /categorías/i });
		expect(button.className).toContain("bg-slate-900");
	});

	it("should render with inactive style when categories are hidden", () => {
		useCategoryUiStore.setState({ isVisible: false });
		render(<CategoriesToggleButton />);

		const button = screen.getByRole("button", { name: /categorías/i });
		expect(button.className).toContain("bg-white");
	});

	it("should hide categories on click when currently visible", () => {
		render(<CategoriesToggleButton />);

		fireEvent.click(screen.getByRole("button", { name: /categorías/i }));

		expect(useCategoryUiStore.getState().isVisible).toBe(false);
	});

	it("should show categories on click when currently hidden", () => {
		useCategoryUiStore.setState({ isVisible: false });
		render(<CategoriesToggleButton />);

		fireEvent.click(screen.getByRole("button", { name: /categorías/i }));

		expect(useCategoryUiStore.getState().isVisible).toBe(true);
	});
});
