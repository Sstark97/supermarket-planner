"use client";

import type { ShoppingHistoryTrendMode } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";

interface TrendAggregationSelectorProps {
	activeMode: ShoppingHistoryTrendMode;
	onModeChange: (mode: ShoppingHistoryTrendMode) => void;
}

export function TrendAggregationSelector({
	activeMode,
	onModeChange,
}: TrendAggregationSelectorProps): React.ReactElement {
	const modes: Array<{ mode: ShoppingHistoryTrendMode; label: string }> = [
		{ mode: "weekly", label: "Semanal" },
		{ mode: "monthly", label: "Mensual" },
		{ mode: "yearly", label: "Anual" },
	];

	return (
		<div className="inline-flex bg-slate-100 p-1 rounded-lg">
			{modes.map(({ mode, label }) => (
				<button
					key={mode}
					onClick={() => onModeChange(mode)}
					className={`px-2.5 py-1.5 text-xs rounded-md font-semibold transition-colors ${
						activeMode === mode
							? "bg-white text-slate-900 shadow-sm"
							: "text-slate-600 hover:text-slate-800"
					}`}
				>
					{label}
				</button>
			))}
		</div>
	);
}
