"use client";

interface ShoppingHistoryMetricsEmptyStateProps {
	message?: string;
}

export function ShoppingHistoryMetricsEmptyState({
	message = "Todavía no hay suficientes datos para mostrar la analítica.",
}: ShoppingHistoryMetricsEmptyStateProps): React.ReactElement {
	return (
		<div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
			{message}
		</div>
	);
}
