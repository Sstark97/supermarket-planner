"use client";

import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import type { ShoppingHistorySupermarketDominancePoint } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";

interface SupermarketDominanceChartProps {
	points: ShoppingHistorySupermarketDominancePoint[];
}

const CHART_COLORS = ["#0f172a", "#1d4ed8", "#0ea5e9", "#16a34a", "#f59e0b"];

export function SupermarketDominanceChart({
	points,
}: SupermarketDominanceChartProps): React.ReactElement {
	return (
		<section className="bg-white border border-slate-200 rounded-xl p-4 h-[340px]">
			<h3 className="text-sm font-semibold text-slate-700 mb-3">
				Dominio por supermercado
			</h3>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={points}
						dataKey="totalSpent"
						nameKey="supermarket"
						cx="50%"
						cy="50%"
						innerRadius={55}
						outerRadius={95}
						paddingAngle={2}
					>
						{points.map((point, index) => (
							<Cell
								key={`dominance-${point.supermarket}`}
								fill={CHART_COLORS[index % CHART_COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip
						formatter={(value: number) => `${value.toFixed(2)}€`}
						labelFormatter={(label: string) => `Supermercado: ${label}`}
					/>
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</section>
	);
}
