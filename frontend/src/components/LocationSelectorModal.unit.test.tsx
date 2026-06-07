import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocationStore } from "@/store/locationStore";
import { LocationSelectorModal } from "./LocationSelectorModal";

const INVALID_POSTAL_CODES = ["00000", "99999", "1234", "123456", "abcde", "53000"];

function typeIntoInput(value: string): void {
	fireEvent.change(screen.getByPlaceholderText("35001"), { target: { value } });
}

describe("LocationSelectorModal", () => {
	beforeEach(() => {
		useLocationStore.setState(useLocationStore.getInitialState(), true);
		useLocationStore.getState().openModal();
	});

	it.each(INVALID_POSTAL_CODES)("should reject invalid postal code %s and show an error message", (invalidCode) => {
		render(<LocationSelectorModal />);

		typeIntoInput(invalidCode);
		fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

		expect(screen.getByText("Código postal no válido")).toBeInTheDocument();
		expect(useLocationStore.getState().postalCode).toBeNull();
	});

	it("should accept a valid Spanish postal code and close the modal", () => {
		render(<LocationSelectorModal />);

		typeIntoInput("35001");
		fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

		expect(useLocationStore.getState().postalCode).toBe("35001");
		expect(useLocationStore.getState().isModalOpen).toBe(false);
	});

	it("should clear the postal code when the clear button is clicked", () => {
		useLocationStore.getState().setPostalCode("35001");

		render(<LocationSelectorModal />);

		fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

		expect(useLocationStore.getState().postalCode).toBeNull();
	});

	it("should close the modal when the close button is clicked", () => {
		render(<LocationSelectorModal />);

		fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

		expect(useLocationStore.getState().isModalOpen).toBe(false);
	});

	it("should close the modal when the overlay is clicked", () => {
		render(<LocationSelectorModal />);

		fireEvent.click(screen.getByTestId("location-selector-overlay"));

		expect(useLocationStore.getState().isModalOpen).toBe(false);
	});

	describe("province hint", () => {
		it("should show nothing when fewer than two digits have been entered", () => {
			render(<LocationSelectorModal />);

			typeIntoInput("3");

			expect(screen.queryByText("Las Palmas")).toBeNull();
		});

		it("should show the matching province name once the first two digits match a known province code", () => {
			render(<LocationSelectorModal />);

			typeIntoInput("35");

			expect(screen.getByText("Las Palmas")).toBeInTheDocument();
		});

		it("should update the province hint as the user keeps typing", () => {
			render(<LocationSelectorModal />);

			typeIntoInput("28");
			expect(screen.getByText("Madrid")).toBeInTheDocument();

			typeIntoInput("35");
			expect(screen.getByText("Las Palmas")).toBeInTheDocument();
			expect(screen.queryByText("Madrid")).toBeNull();
		});

		it("should show nothing when the prefix does not match any known province code", () => {
			render(<LocationSelectorModal />);

			typeIntoInput("00");

			expect(screen.queryByText("Las Palmas")).toBeNull();
			expect(screen.queryByText("Madrid")).toBeNull();
		});
	});
});
