import { useEffect, useState } from "react";
import type {
	ShoppingSessionGateway,
	ShoppingSessionHistoryEntry,
} from "@/lib/http/ShoppingSessionGateway";
import { getAuthToken } from "@/lib/auth/getAuthToken";

interface ShoppingHistoryEntriesState {
	entries: ShoppingSessionHistoryEntry[];
	isLoading: boolean;
	errorMessage: string | null;
}

export function useShoppingHistoryEntries(
	status: string,
	shoppingSessionGateway: ShoppingSessionGateway,
): ShoppingHistoryEntriesState {
	const [entries, setEntries] = useState<ShoppingSessionHistoryEntry[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (status !== "authenticated") {
			setIsLoading(false);
			return;
		}

		let isCancelled = false;

		const loadShoppingHistory = async (): Promise<void> => {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const token = await getAuthToken();
				const response = await shoppingSessionGateway.list(token);
				if (isCancelled) {
					return;
				}
				setEntries(response.sessions);
			} catch {
				if (!isCancelled) {
					setErrorMessage("No se pudo cargar el historial de compras.");
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		void loadShoppingHistory();

		return () => {
			isCancelled = true;
		};
	}, [shoppingSessionGateway, status]);

	return {
		entries,
		isLoading,
		errorMessage,
	};
}
