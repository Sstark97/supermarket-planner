"use client";

import { ChevronLeft } from "lucide-react";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import { ShoppingHistoryDateFormatter } from "@/features/shopping-history/model/ShoppingHistoryDateFormatter";
import { ShoppingHistoryBreakdownCalculator } from "@/features/shopping-history/model/ShoppingHistoryBreakdownCalculator";

interface TicketDetailProps {
	entry: ShoppingSessionHistoryEntry | null;
	onBackToList?: () => void;
	isMobile: boolean;
	dateFormatter: ShoppingHistoryDateFormatter;
	breakdownCalculator: ShoppingHistoryBreakdownCalculator;
}

export function TicketDetail({
	entry,
	onBackToList,
	isMobile,
	dateFormatter,
	breakdownCalculator,
}: TicketDetailProps): React.ReactElement {
	if (!entry) {
		return (
			<section className="bg-white border border-slate-200 rounded-2xl p-5">
				<p className="text-slate-600">
					Seleccioná una compra para ver el detalle.
				</p>
			</section>
		);
	}

	const supermarketBreakdown =
		breakdownCalculator.buildSupermarketBreakdown(entry);

	return (
		<section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
			{isMobile && onBackToList && (
				<div className="sticky top-16 z-20 -mx-5 -mt-5 mb-1 px-4 py-3 border-b border-slate-100 bg-white/95 backdrop-blur">
					<button
						onClick={onBackToList}
						className="w-full min-h-11 inline-flex items-center gap-2 px-3 py-2 text-base font-semibold text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50"
					>
						<ChevronLeft size={20} />
						Volver al listado
					</button>
				</div>
			)}

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold text-slate-900">
						Detalle de compra
					</h2>
					<p className="text-sm text-slate-600">
						Fecha compra:{" "}
						{dateFormatter.formatCalendarDateTime(entry.shoppedAt)}
					</p>
					<p className="text-sm text-slate-600">
						Guardado: {dateFormatter.formatCalendarDateTime(entry.createdAt)}
					</p>
				</div>
				<div className="text-right">
					<p className="text-xs uppercase tracking-wide text-slate-500">
						Total
					</p>
					<p className="text-3xl font-bold text-slate-900">
						{entry.totalPrice.toFixed(2)}€
					</p>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{Object.entries(supermarketBreakdown).map(([name, data]) => (
					<div key={name} className="border border-slate-200 rounded-xl p-3">
						<p className="text-sm font-semibold text-slate-800 capitalize">
							{name}
						</p>
						<p className="text-sm text-slate-600">{data.items} uds</p>
						<p className="text-lg font-bold text-slate-900">
							{data.total.toFixed(2)}€
						</p>
					</div>
				))}
			</div>

			<div className="overflow-x-auto border border-slate-200 rounded-xl">
				<table className="min-w-full text-sm">
					<thead className="bg-slate-50 text-slate-600">
						<tr>
							<th className="text-left px-3 py-2 font-semibold">Producto</th>
							<th className="text-left px-3 py-2 font-semibold">
								Supermercado
							</th>
							<th className="text-right px-3 py-2 font-semibold">Cantidad</th>
							<th className="text-right px-3 py-2 font-semibold">Precio</th>
							<th className="text-right px-3 py-2 font-semibold">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{entry.items.map((item, index) => (
							<tr
								key={`${item.productName}-${item.supermarket}-${index}`}
								className="border-t border-slate-100"
							>
								<td className="px-3 py-2 text-slate-800">{item.productName}</td>
								<td className="px-3 py-2 text-slate-600 capitalize">
									{item.supermarket}
								</td>
								<td className="px-3 py-2 text-right text-slate-700">
									{item.quantity}
								</td>
								<td className="px-3 py-2 text-right text-slate-700">
									{item.price.toFixed(2)}€
								</td>
								<td className="px-3 py-2 text-right font-semibold text-slate-900">
									{(item.price * item.quantity).toFixed(2)}€
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
