import type {
	ShoppingHistoryFormattedTicketMetrics,
	ShoppingHistoryTicketMetricsSnapshot,
} from "./ShoppingHistoryMetricsContracts";

export class ShoppingHistoryMetricsFormatter {
	private readonly moneyFormatter = new Intl.NumberFormat("es-ES", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 2,
	});

	formatTicketMetrics(
		ticketMetrics: ShoppingHistoryTicketMetricsSnapshot,
	): ShoppingHistoryFormattedTicketMetrics {
		return {
			averageTicketCostLabel: this.moneyFormatter.format(
				ticketMetrics.averageTicketCost,
			),
			totalSpentToDateLabel: this.moneyFormatter.format(
				ticketMetrics.totalSpentToDate,
			),
			totalTicketsLabel: new Intl.NumberFormat("es-ES").format(
				ticketMetrics.totalTickets,
			),
			mostFrequentGroceryDayLabel:
				ticketMetrics.mostFrequentGroceryDay ?? "Sin datos",
		};
	}
}
