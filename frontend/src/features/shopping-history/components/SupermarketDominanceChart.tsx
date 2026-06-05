"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ShoppingHistorySupermarketDominancePoint } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";

interface SupermarketDominanceChartProps {
	points: ShoppingHistorySupermarketDominancePoint[];
}

const CHART_COLORS = ["#0f172a", "#1d4ed8", "#0ea5e9", "#16a34a", "#f59e0b"];

export function SupermarketDominanceChart({
	points,
}: SupermarketDominanceChartProps): React.ReactElement {
	return (
		<section className="bg-white border border-slate-200 rounded-xl p-4">
			<h3 className="text-sm font-semibold text-slate-700 mb-3">
				Dominio por supermercado
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_200px] gap-3 items-center min-h-[280px]">
				<div className="h-[260px]">
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
						</PieChart>
					</ResponsiveContainer>
				</div>

				<ul className="space-y-2">
					{points.map((point, index) => (
						<li
							key={`legend-${point.supermarket}`}
							className="flex items-center justify-between gap-2 text-sm"
						>
							<div className="flex items-center gap-2 min-w-0">
								<span
									className="h-2.5 w-2.5 rounded-full shrink-0"
									style={{
										backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
									}}
								/>
								<span className="text-slate-700 truncate capitalize">
									{point.supermarket}
								</span>
							</div>
							<span className="text-slate-500 tabular-nums">
								{point.spentPercentage.toFixed(1)}%
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
