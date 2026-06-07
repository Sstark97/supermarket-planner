import { beforeEach, describe, expect, it } from "vitest";
import { useLocationStore } from "./locationStore";

describe("locationStore", () => {
	beforeEach(() => {
		useLocationStore.setState(useLocationStore.getInitialState(), true);
		sessionStorage.clear();
	});

	it("should initialize with null postalCode and closed modal", () => {
		const state = useLocationStore.getState();

		expect(state.postalCode).toBeNull();
		expect(state.isModalOpen).toBe(false);
	});

	it("should set a valid postal code", () => {
		useLocationStore.getState().setPostalCode("35001");

		expect(useLocationStore.getState().postalCode).toBe("35001");
	});

	it("should clear the postal code when set to null", () => {
		useLocationStore.getState().setPostalCode("35001");
		useLocationStore.getState().setPostalCode(null);

		expect(useLocationStore.getState().postalCode).toBeNull();
	});

	it("should open and close the modal independently of postal code", () => {
		useLocationStore.getState().setPostalCode("35001");
		useLocationStore.getState().openModal();

		expect(useLocationStore.getState().isModalOpen).toBe(true);
		expect(useLocationStore.getState().postalCode).toBe("35001");

		useLocationStore.getState().closeModal();

		expect(useLocationStore.getState().isModalOpen).toBe(false);
		expect(useLocationStore.getState().postalCode).toBe("35001");
	});

	it("should persist postalCode to sessionStorage", () => {
		useLocationStore.getState().setPostalCode("35001");

		const persisted = sessionStorage.getItem("supermarket-planner-location");
		expect(persisted).not.toBeNull();

		const parsed = JSON.parse(persisted as string) as { state: { postalCode: string | null } };
		expect(parsed.state.postalCode).toBe("35001");
		expect(parsed.state).not.toHaveProperty("isModalOpen");
	});
});
