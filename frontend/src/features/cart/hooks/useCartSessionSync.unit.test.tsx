import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ProductCategory, type IProduct } from "@/types";
import { useCartStore } from "@/store/cartStore";

// Mock next-auth/react before any imports that reference it
const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
	useSession: () => mockUseSession(),
}));

// Mock getAuthToken
const mockGetAuthToken = vi.fn().mockResolvedValue("mock-token");
vi.mock("@/lib/auth/getAuthToken", () => ({
	getAuthToken: () => mockGetAuthToken(),
}));

// Mock the cart merge gateway
const mockMerge = vi.fn();
vi.mock("@/lib/di/ClientContainerDI", () => ({
	ClientContainerDI: vi.fn().mockImplementation(() => ({
		resolveCartMergeGateway: () => ({ merge: mockMerge }),
	})),
}));

// Import AFTER all mocks are in place
const { useCartSessionSync } = await import("./useCartSessionSync");

function buildProduct(id: string, supermarket: string): IProduct {
	return {
		id,
		supermarket,
		name: `${supermarket}-${id}`,
		category: ProductCategory.OTHER,
		price: 1.5,
		pricePerUnit: 1.5,
		unit: "ud",
		taxType: "IGIC",
		scrapedAt: new Date().toISOString(),
	};
}

describe("useCartSessionSync", () => {
	beforeEach(() => {
		useCartStore.setState(useCartStore.getInitialState(), true);
		mockMerge.mockReset();
		mockGetAuthToken.mockReset();
		mockGetAuthToken.mockResolvedValue("mock-token");
	});

	it("merges local cart items with the server when transitioning from unauthenticated to authenticated", async () => {
		const product = buildProduct("1", "Mercadona");
		useCartStore.getState().addItem(product);

		const mergedItem = {
			productName: product.name,
			supermarket: product.supermarket,
			category: product.category,
			price: product.price,
			pricePerUnit: product.pricePerUnit,
			unit: product.unit,
			taxType: product.taxType,
			quantity: 1,
		};
		mockMerge.mockResolvedValue({ items: [mergedItem], totalItems: 1 });

		// Start as unauthenticated
		mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
		const { rerender } = renderHook(() => useCartSessionSync());

		// Transition to authenticated
		mockUseSession.mockReturnValue({ status: "authenticated", data: { user: {} } });

		await act(async () => {
			rerender();
			// Allow async merge to complete
			await Promise.resolve();
		});

		expect(mockMerge).toHaveBeenCalledOnce();
		const [calledItems, calledToken] = mockMerge.mock.calls[0];
		expect(calledItems).toHaveLength(1);
		expect(calledItems[0].productName).toBe(product.name);
		expect(calledToken).toBe("mock-token");
	});

	it("replaces the cart store with the merged server result after a successful merge", async () => {
		const product = buildProduct("apple", "Carrefour");
		useCartStore.getState().addItem(product);

		const serverMergedItem = {
			productName: "apple-from-server",
			supermarket: "Carrefour",
			category: ProductCategory.OTHER,
			price: 2.0,
			pricePerUnit: 2.0,
			unit: "kg",
			taxType: "IGIC",
			quantity: 3,
		};
		mockMerge.mockResolvedValue({ items: [serverMergedItem], totalItems: 3 });

		mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
		const { rerender } = renderHook(() => useCartSessionSync());

		mockUseSession.mockReturnValue({ status: "authenticated", data: { user: {} } });

		await act(async () => {
			rerender();
			await Promise.resolve();
		});

		const state = useCartStore.getState();
		expect(state.totalItems).toBe(3);
		expect(state.items).toHaveLength(1);
		expect(state.items[0].product.name).toBe("apple-from-server");
	});

	it("clears the cart when transitioning from authenticated to unauthenticated", async () => {
		const product = buildProduct("2", "Aldi");
		useCartStore.getState().addItem(product);

		mockUseSession.mockReturnValue({ status: "authenticated", data: { user: {} } });
		const { rerender } = renderHook(() => useCartSessionSync());

		mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });

		await act(async () => {
			rerender();
		});

		const state = useCartStore.getState();
		expect(state.items).toHaveLength(0);
		expect(state.totalItems).toBe(0);
	});

	it("does not trigger a merge when the user is already authenticated on page load", async () => {
		const product = buildProduct("3", "Lidl");
		useCartStore.getState().addItem(product);

		// Page load: starts as loading then settles to authenticated (no prior unauthenticated)
		mockUseSession.mockReturnValue({ status: "loading", data: null });
		const { rerender } = renderHook(() => useCartSessionSync());

		mockUseSession.mockReturnValue({ status: "authenticated", data: { user: {} } });

		await act(async () => {
			rerender();
		});

		expect(mockMerge).not.toHaveBeenCalled();
	});

	it("does not clear the cart when a merge API error occurs", async () => {
		const product = buildProduct("4", "HiperDino");
		useCartStore.getState().addItem(product);

		mockMerge.mockRejectedValue(new Error("Network error"));

		mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
		const { rerender } = renderHook(() => useCartSessionSync());

		mockUseSession.mockReturnValue({ status: "authenticated", data: { user: {} } });

		await act(async () => {
			rerender();
			// Allow the rejected promise to settle
			await Promise.resolve();
			await Promise.resolve();
		});

		const state = useCartStore.getState();
		expect(state.items).toHaveLength(1);
		expect(state.totalItems).toBe(1);
	});

	it("does not call merge when the cart is empty on login", async () => {
		// Cart is empty — no items to merge
		mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
		const { rerender } = renderHook(() => useCartSessionSync());

		mockUseSession.mockReturnValue({ status: "authenticated", data: { user: {} } });

		await act(async () => {
			rerender();
		});

		expect(mockMerge).not.toHaveBeenCalled();
	});
});
