"use client";

import { useState } from "react";
import type {
	ShoppingHistoryInsightsModel,
	ShoppingHistoryTrendMode,
} from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";
import { ShoppingHistoryKpiCards } from "./ShoppingHistoryKpiCards";
import { ShoppingHistoryMetricsEmptyState } from "./ShoppingHistoryMetricsEmptyState";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { SupermarketDominanceChart } from "./SupermarketDominanceChart";
import { TrendAggregationSelector } from "./TrendAggregationSelector";

interface ShoppingHistoryInsightsPanelProps {
	metrics: ShoppingHistoryInsightsModel | null;
	isLoading: boolean;
	errorMessage: string | null;
}

export function ShoppingHistoryInsightsPanel({
	metrics,
	isLoading,
	errorMessage,
}: ShoppingHistoryInsightsPanelProps): React.ReactElement {
	const [activeTrendMode, setActiveTrendMode] =
		useState<ShoppingHistoryTrendMode>("monthly");

	if (isLoading) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-24 bg-slate-100 rounded-xl" />
				<div className="h-80 bg-slate-100 rounded-xl" />
			</div>
		);
	}

	if (errorMessage) {
		return <ShoppingHistoryMetricsEmptyState message={errorMessage} />;
	}

	if (!metrics) {
		return <ShoppingHistoryMetricsEmptyState />;
	}

	const trendData = metrics.snapshot.trends[activeTrendMode];

	if (metrics.snapshot.ticketMetrics.totalTickets === 0) {
		return <ShoppingHistoryMetricsEmptyState />;
	}

	return (
		<div className="space-y-4">
			<ShoppingHistoryKpiCards
				formattedMetrics={metrics.formattedTicketMetrics}
			/>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<SupermarketDominanceChart
					points={metrics.snapshot.supermarketDominance}
				/>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-slate-700">
							Comparativa temporal
						</h3>
						<TrendAggregationSelector
							activeMode={activeTrendMode}
							onModeChange={setActiveTrendMode}
						/>
					</div>
					<SpendingTrendChart points={trendData} mode={activeTrendMode} />
				</div>
			</div>
		</div>
	);
}
