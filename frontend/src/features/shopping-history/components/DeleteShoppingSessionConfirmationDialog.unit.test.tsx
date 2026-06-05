import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeleteShoppingSessionConfirmationDialog } from "./DeleteShoppingSessionConfirmationDialog";

describe("DeleteShoppingSessionConfirmationDialog", () => {
	it("should not render when closed", () => {
		render(
			<DeleteShoppingSessionConfirmationDialog
				isOpen={false}
				isDeleting={false}
				onCancel={() => undefined}
				onConfirm={() => undefined}
			/>,
		);

		expect(
			screen.queryByText("¿Seguro que querés eliminar esta compra? Esta acción no se puede deshacer."),
		).toBeNull();
	});

	it("should call onCancel when cancel button is clicked", () => {
		const onCancel = vi.fn();

		render(
			<DeleteShoppingSessionConfirmationDialog
				isOpen
				isDeleting={false}
				onCancel={onCancel}
				onConfirm={() => undefined}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it("should call onConfirm when delete button is clicked", () => {
		const onConfirm = vi.fn();

		render(
			<DeleteShoppingSessionConfirmationDialog
				isOpen
				isDeleting={false}
				onCancel={() => undefined}
				onConfirm={onConfirm}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

		expect(onConfirm).toHaveBeenCalledOnce();
	});
});
