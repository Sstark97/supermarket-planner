import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileFilterDrawer } from "./MobileFilterDrawer";

describe("MobileFilterDrawer", () => {
	const onClose = vi.fn();

	beforeEach(() => {
		onClose.mockReset();
	});

	it("renders nothing when closed", () => {
		const { container } = render(
			<MobileFilterDrawer isOpen={false} onClose={onClose}>
				<p>Drawer content</p>
			</MobileFilterDrawer>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("renders children when open", () => {
		render(
			<MobileFilterDrawer isOpen={true} onClose={onClose}>
				<p>Drawer content</p>
			</MobileFilterDrawer>,
		);

		expect(screen.getByText("Drawer content")).toBeTruthy();
	});

	it("shows the drawer title when open", () => {
		render(
			<MobileFilterDrawer isOpen={true} onClose={onClose}>
				<p>Content</p>
			</MobileFilterDrawer>,
		);

		expect(screen.getByText("Filtros y Orden")).toBeTruthy();
	});

	it("calls onClose when the close button is clicked", () => {
		render(
			<MobileFilterDrawer isOpen={true} onClose={onClose}>
				<p>Content</p>
			</MobileFilterDrawer>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Cerrar filtros" }));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("calls onClose when the backdrop is clicked", () => {
		render(
			<MobileFilterDrawer isOpen={true} onClose={onClose}>
				<p>Content</p>
			</MobileFilterDrawer>,
		);

		fireEvent.click(screen.getByTestId("drawer-backdrop"));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("renders as a dialog with the correct accessible label", () => {
		render(
			<MobileFilterDrawer isOpen={true} onClose={onClose}>
				<p>Content</p>
			</MobileFilterDrawer>,
		);

		const dialog = screen.getByRole("dialog", { name: "Filtros y Orden" });
		expect(dialog).toBeTruthy();
	});
});
