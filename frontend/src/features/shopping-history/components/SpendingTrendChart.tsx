"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { ShoppingHistoryTrendMode } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";
import type { ShoppingSessionTrendPoint } from "@/lib/http/ShoppingSessionGateway";

interface SpendingTrendChartProps {
	points: ShoppingSessionTrendPoint[];
	mode: ShoppingHistoryTrendMode;
}

const TREND_COLORS_BY_MODE: Record<ShoppingHistoryTrendMode, string[]> = {
	weekly: ["#2563eb", "#0ea5e9", "#6366f1", "#8b5cf6", "#14b8a6", "#22c55e"],
	monthly: ["#1d4ed8", "#0f766e", "#16a34a", "#f59e0b", "#f97316", "#ef4444"],
	yearly: ["#4338ca", "#7c3aed", "#db2777", "#ea580c", "#ca8a04", "#0891b2"],
};

export function SpendingTrendChart({
	points,
	mode,
}: SpendingTrendChartProps): React.ReactElement {
	const palette = TREND_COLORS_BY_MODE[mode];

	return (
		<section className="bg-white border border-slate-200 rounded-xl p-4 h-[340px]">
			<h3 className="text-sm font-semibold text-slate-700 mb-3">
				Tendencia de gasto
			</h3>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={points}
					margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
					<XAxis
						dataKey="period"
						tick={{ fontSize: 11 }}
						angle={-20}
						textAnchor="end"
						interval={0}
					/>
					<YAxis tick={{ fontSize: 11 }} width={50} />
					<Tooltip
						formatter={(value: number) => `${value.toFixed(2)}€`}
						labelFormatter={(label: string) => `Periodo: ${label}`}
					/>
					<Bar dataKey="amount" radius={[6, 6, 0, 0]}>
						{points.map((point, index) => (
							<Cell
								key={`trend-${mode}-${point.period}`}
								fill={palette[index % palette.length]}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</section>
	);
}
