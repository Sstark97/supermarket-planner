import { describe, expect, it } from "vitest";
import { ShoppingHistoryMetricsChartMapper } from "./ShoppingHistoryMetricsChartMapper";

describe("ShoppingHistoryMetricsChartMapper", () => {
	it("should map dominance percentages and trend snapshots", () => {
		const mapper = new ShoppingHistoryMetricsChartMapper();

		const snapshot = mapper.toInsightsSnapshot({
			supermarketDominance: [
				{ supermarket: "mercadona", totalSpent: 30, totalItems: 3 },
				{ supermarket: "lidl", totalSpent: 70, totalItems: 7 },
			],
			spendingTrends: {
				weeklyAverage: [{ period: "2026-22", amount: 10 }],
				monthlyTotal: [{ period: "2026-06", amount: 100 }],
				yearlyTotal: [{ period: "2026", amount: 400 }],
			},
			ticketMetrics: {
				averageTicketCost: 20,
				totalSpentToDate: 400,
				totalTickets: 20,
				mostFrequentGroceryDay: "Sábado",
			},
		});

		expect(snapshot.supermarketDominance).toHaveLength(2);
		expect(snapshot.supermarketDominance[0].spentPercentage).toBe(30);
		expect(snapshot.supermarketDominance[1].itemsPercentage).toBe(70);
		expect(snapshot.trends.monthly[0].period).toBe("2026-06");
	});

	it("should return zero percentages when totals are zero", () => {
		const mapper = new ShoppingHistoryMetricsChartMapper();

		const snapshot = mapper.toInsightsSnapshot({
			supermarketDominance: [
				{ supermarket: "mercadona", totalSpent: 0, totalItems: 0 },
			],
			spendingTrends: {
				weeklyAverage: [],
				monthlyTotal: [],
				yearlyTotal: [],
			},
			ticketMetrics: {
				averageTicketCost: 0,
				totalSpentToDate: 0,
				totalTickets: 0,
				mostFrequentGroceryDay: null,
			},
		});

		expect(snapshot.supermarketDominance[0].spentPercentage).toBe(0);
		expect(snapshot.supermarketDominance[0].itemsPercentage).toBe(0);
	});
});
