"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { ShoppingSessionTrendPoint } from "@/lib/http/ShoppingSessionGateway";

interface SpendingTrendChartProps {
	points: ShoppingSessionTrendPoint[];
}

export function SpendingTrendChart({
	points,
}: SpendingTrendChartProps): React.ReactElement {
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
					<Bar dataKey="amount" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</section>
	);
}
