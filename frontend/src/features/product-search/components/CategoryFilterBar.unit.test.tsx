import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { useCategoryUiStore } from "@/store/categoryUiStore";

vi.mock("./CategoryFilter", () => ({
	CategoryFilter: () => <div data-testid="category-filter">Categorías</div>,
}));

describe("CategoryFilterBar", () => {
	beforeEach(() => {
		useCategoryUiStore.setState(useCategoryUiStore.getInitialState(), true);
	});

	it("should render CategoryFilter when visible", () => {
		render(<CategoryFilterBar />);

		expect(screen.getByTestId("category-filter")).toBeTruthy();
	});

	it("should not apply md:hidden when categories are visible", () => {
		const { container } = render(<CategoryFilterBar />);

		expect((container.firstChild as HTMLElement).className).not.toContain("md:hidden");
	});

	it("should apply md:hidden when categories are hidden", () => {
		useCategoryUiStore.setState({ isVisible: false });
		const { container } = render(<CategoryFilterBar />);

		expect((container.firstChild as HTMLElement).className).toContain("md:hidden");
	});
});
