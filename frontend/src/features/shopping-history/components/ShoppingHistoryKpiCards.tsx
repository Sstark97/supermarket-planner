"use client";

import type { ShoppingHistoryFormattedTicketMetrics } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";

interface ShoppingHistoryKpiCardsProps {
	formattedMetrics: ShoppingHistoryFormattedTicketMetrics;
}

export function ShoppingHistoryKpiCards({
	formattedMetrics,
}: ShoppingHistoryKpiCardsProps): React.ReactElement {
	const cards = [
		{
			label: "Average Ticket Cost",
			value: formattedMetrics.averageTicketCostLabel,
		},
		{
			label: "Total Spent to Date",
			value: formattedMetrics.totalSpentToDateLabel,
		},
		{
			label: "Most Frequent Grocery Day",
			value: formattedMetrics.mostFrequentGroceryDayLabel,
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
			{cards.map((card) => (
				<article
					key={card.label}
					className="bg-white border border-slate-200 rounded-xl p-4"
				>
					<p className="text-xs uppercase tracking-wide text-slate-500">
						{card.label}
					</p>
					<p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
				</article>
			))}
		</div>
	);
}
