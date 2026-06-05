import { useState } from "react";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import { useToast } from "@/components/Toast";
import { ShoppingHistoryDeleteCoordinator } from "@/features/shopping-history/model/ShoppingHistoryDeleteCoordinator";

interface ShoppingHistoryDeleteState {
	isConfirmationDialogOpen: boolean;
	isDeleting: boolean;
	sessionIdPendingDelete: string | null;
	openDeleteConfirmation: (sessionId: string) => void;
	closeDeleteConfirmation: () => void;
	confirmDelete: () => Promise<void>;
}

export function useShoppingHistoryDelete(
	deleteCoordinator: ShoppingHistoryDeleteCoordinator,
	removeEntryBySessionId: (sessionId: string) => void,
): ShoppingHistoryDeleteState {
	const { showToast } = useToast();
	const [sessionIdPendingDelete, setSessionIdPendingDelete] = useState<string | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	function openDeleteConfirmation(sessionId: string): void {
		setSessionIdPendingDelete(sessionId);
	}

	function closeDeleteConfirmation(): void {
		if (isDeleting) {
			return;
		}
		setSessionIdPendingDelete(null);
	}

	async function confirmDelete(): Promise<void> {
		if (!sessionIdPendingDelete) {
			return;
		}

		setIsDeleting(true);
		try {
			const token = await getAuthToken();
			const deleted = await deleteCoordinator.deleteSession(
				sessionIdPendingDelete,
				token,
			);

			if (deleted) {
				removeEntryBySessionId(sessionIdPendingDelete);
				showToast("Compra eliminada correctamente", "success");
			}

			setSessionIdPendingDelete(null);
		} catch {
			showToast("No se pudo eliminar la compra", "error");
		} finally {
			setIsDeleting(false);
		}
	}

	return {
		isConfirmationDialogOpen: sessionIdPendingDelete !== null,
		isDeleting,
		sessionIdPendingDelete,
		openDeleteConfirmation,
		closeDeleteConfirmation,
		confirmDelete,
	};
}
