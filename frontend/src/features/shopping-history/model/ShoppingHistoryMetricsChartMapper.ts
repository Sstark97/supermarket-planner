import type { ShoppingSessionSupermarketDominanceMetric } from "@/lib/http/ShoppingSessionGateway";
import type {
	ShoppingHistoryInsightsMetricsSnapshot,
	ShoppingHistorySupermarketDominancePoint,
	ShoppingSessionMetricsApiSnapshot,
} from "./ShoppingHistoryMetricsContracts";

export class ShoppingHistoryMetricsChartMapper {
	toInsightsSnapshot(
		apiSnapshot: ShoppingSessionMetricsApiSnapshot,
	): ShoppingHistoryInsightsMetricsSnapshot {
		return {
			supermarketDominance: this.mapSupermarketDominance(
				apiSnapshot.supermarketDominance,
			),
			trends: {
				weekly: apiSnapshot.spendingTrends.weeklyAverage,
				monthly: apiSnapshot.spendingTrends.monthlyTotal,
				yearly: apiSnapshot.spendingTrends.yearlyTotal,
			},
			ticketMetrics: {
				averageTicketCost: apiSnapshot.ticketMetrics.averageTicketCost,
				totalSpentToDate: apiSnapshot.ticketMetrics.totalSpentToDate,
				totalTickets: apiSnapshot.ticketMetrics.totalTickets,
				mostFrequentGroceryDay:
					apiSnapshot.ticketMetrics.mostFrequentGroceryDay,
			},
		};
	}

	private mapSupermarketDominance(
		supermarketMetrics: ShoppingSessionSupermarketDominanceMetric[],
	): ShoppingHistorySupermarketDominancePoint[] {
		const totalSpentAcrossSupermarkets = supermarketMetrics.reduce(
			(totalSpent, metric) => totalSpent + metric.totalSpent,
			0,
		);
		const totalItemsAcrossSupermarkets = supermarketMetrics.reduce(
			(totalItems, metric) => totalItems + metric.totalItems,
			0,
		);

		return supermarketMetrics.map((metric) => ({
			supermarket: metric.supermarket,
			totalSpent: metric.totalSpent,
			totalItems: metric.totalItems,
			spentPercentage: this.calculatePercentage(
				metric.totalSpent,
				totalSpentAcrossSupermarkets,
			),
			itemsPercentage: this.calculatePercentage(
				metric.totalItems,
				totalItemsAcrossSupermarkets,
			),
		}));
	}

	private calculatePercentage(value: number, total: number): number {
		if (total <= 0) {
			return 0;
		}

		return Number(((value / total) * 100).toFixed(2));
	}
}
