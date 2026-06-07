import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocationStore } from "@/store/locationStore";
import { LocationSelector } from "./LocationSelector";

describe("LocationSelector", () => {
	beforeEach(() => {
		useLocationStore.setState(useLocationStore.getInitialState(), true);
	});

	it("should render the trigger button with default label when no postal code is set", () => {
		render(<LocationSelector />);

		expect(screen.getByRole("button", { name: /Tu zona/i })).toBeInTheDocument();
	});

	it("should display the stored postal code in the trigger button", () => {
		useLocationStore.setState({ postalCode: "35001", isHydrated: true });

		render(<LocationSelector />);

		expect(screen.getByRole("button", { name: /35001/i })).toBeInTheDocument();
	});

	it("should show the placeholder label until hydration completes even when a postal code is persisted", () => {
		useLocationStore.setState({ postalCode: "35001", isHydrated: false });

		render(<LocationSelector />);

		expect(screen.getByRole("button", { name: /Tu zona/i })).toBeInTheDocument();
		expect(screen.queryByText("35001")).toBeNull();
	});

	it("should open the modal when the trigger button is clicked", () => {
		render(<LocationSelector />);

		fireEvent.click(screen.getByRole("button", { name: /Tu zona/i }));

		expect(screen.getByText("Tu código postal")).toBeInTheDocument();
		expect(useLocationStore.getState().isModalOpen).toBe(true);
	});
});
