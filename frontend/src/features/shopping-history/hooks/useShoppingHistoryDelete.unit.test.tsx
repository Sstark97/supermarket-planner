import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShoppingHistoryDelete } from "./useShoppingHistoryDelete";

const mockDeleteSession = vi.fn();
const mockShowToast = vi.fn();
const mockGetAuthToken = vi.fn();

vi.mock("@/lib/auth/getAuthToken", () => ({
	getAuthToken: () => mockGetAuthToken(),
}));

vi.mock("@/components/Toast", () => ({
	useToast: () => ({ showToast: mockShowToast }),
}));

describe("useShoppingHistoryDelete", () => {
	beforeEach(() => {
		mockDeleteSession.mockReset();
		mockShowToast.mockReset();
		mockGetAuthToken.mockReset();
		mockGetAuthToken.mockResolvedValue("token-123");
	});

	it("should remove entry and show success toast on successful delete", async () => {
		mockDeleteSession.mockResolvedValue(true);
		const removeEntryBySessionId = vi.fn();
		const coordinator = { deleteSession: mockDeleteSession };

		const { result } = renderHook(() =>
			useShoppingHistoryDelete(
				coordinator as never,
				removeEntryBySessionId,
			),
		);

		act(() => {
			result.current.openDeleteConfirmation("session-1");
		});

		await act(async () => {
			await result.current.confirmDelete();
		});

		expect(mockDeleteSession).toHaveBeenCalledWith("session-1", "token-123");
		expect(removeEntryBySessionId).toHaveBeenCalledWith("session-1");
		expect(mockShowToast).toHaveBeenCalledWith(
			"Compra eliminada correctamente",
			"success",
		);
	});

	it("should keep entry and show error toast on failure", async () => {
		mockDeleteSession.mockRejectedValue(new Error("delete failed"));
		const removeEntryBySessionId = vi.fn();
		const coordinator = { deleteSession: mockDeleteSession };

		const { result } = renderHook(() =>
			useShoppingHistoryDelete(
				coordinator as never,
				removeEntryBySessionId,
			),
		);

		act(() => {
			result.current.openDeleteConfirmation("session-1");
		});

		await act(async () => {
			await result.current.confirmDelete();
		});

		expect(removeEntryBySessionId).not.toHaveBeenCalled();
		expect(mockShowToast).toHaveBeenCalledWith(
			"No se pudo eliminar la compra",
			"error",
		);
	});
});
