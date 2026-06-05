import { describe, expect, it } from "vitest";
import { ShoppingHistoryMetricsFormatter } from "./ShoppingHistoryMetricsFormatter";

describe("ShoppingHistoryMetricsFormatter", () => {
	it("should format ticket metrics labels for display", () => {
		const formatter = new ShoppingHistoryMetricsFormatter();

		const result = formatter.formatTicketMetrics({
			averageTicketCost: 12.5,
			totalSpentToDate: 1234.56,
			totalTickets: 42,
			mostFrequentGroceryDay: "Sábado",
		});

		expect(result.averageTicketCostLabel).toContain("12");
		expect(result.totalSpentToDateLabel).toContain("1234");
		expect(result.totalTicketsLabel).toBe("42");
		expect(result.mostFrequentGroceryDayLabel).toBe("Sábado");
	});

	it("should fallback most frequent day label when no data exists", () => {
		const formatter = new ShoppingHistoryMetricsFormatter();

		const result = formatter.formatTicketMetrics({
			averageTicketCost: 0,
			totalSpentToDate: 0,
			totalTickets: 0,
			mostFrequentGroceryDay: null,
		});

		expect(result.mostFrequentGroceryDayLabel).toBe("Sin datos");
	});
});
