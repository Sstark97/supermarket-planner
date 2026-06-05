import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import type { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import type { ShoppingHistoryInsightsModel } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";
import { ShoppingHistoryInsightsModelAssembler } from "@/features/shopping-history/model/ShoppingHistoryInsightsModelAssembler";

interface UseShoppingHistoryMetricsDependencies {
	shoppingSessionGateway: ShoppingSessionGateway;
	modelAssembler: ShoppingHistoryInsightsModelAssembler;
}

interface UseShoppingHistoryMetricsState {
	metrics: ShoppingHistoryInsightsModel | null;
	isLoading: boolean;
	errorMessage: string | null;
	reload: () => Promise<void>;
}

export function useShoppingHistoryMetrics(
	status: string,
	isInsightsActive: boolean,
	dependencies: UseShoppingHistoryMetricsDependencies,
): UseShoppingHistoryMetricsState {
	const { shoppingSessionGateway, modelAssembler } = dependencies;
	const [metrics, setMetrics] = useState<ShoppingHistoryInsightsModel | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	async function loadMetrics(): Promise<void> {
		if (status !== "authenticated" || !isInsightsActive) {
			return;
		}

		setIsLoading(true);
		setErrorMessage(null);
		try {
			const token = await getAuthToken();
			const apiSnapshot = await shoppingSessionGateway.getMetrics(token);
			setMetrics(modelAssembler.assemble(apiSnapshot));
		} catch {
			setErrorMessage("No se pudieron cargar tus métricas de compra.");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		if (status !== "authenticated" || !isInsightsActive) {
			setIsLoading(false);
			return;
		}

		let isCancelled = false;

		const loadMetricsSafely = async (): Promise<void> => {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const token = await getAuthToken();
				const apiSnapshot = await shoppingSessionGateway.getMetrics(token);
				if (isCancelled) {
					return;
				}
				setMetrics(modelAssembler.assemble(apiSnapshot));
			} catch {
				if (!isCancelled) {
					setErrorMessage("No se pudieron cargar tus métricas de compra.");
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		void loadMetricsSafely();

		return () => {
			isCancelled = true;
		};
	}, [isInsightsActive, modelAssembler, shoppingSessionGateway, status]);

	return {
		metrics,
		isLoading,
		errorMessage,
		reload: loadMetrics,
	};
}
