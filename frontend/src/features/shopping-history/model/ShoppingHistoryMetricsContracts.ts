import type {
	GetShoppingSessionMetricsResponse,
	ShoppingSessionTrendPoint,
} from "@/lib/http/ShoppingSessionGateway";

export type ShoppingHistoryTrendMode = "weekly" | "monthly" | "yearly";

export interface ShoppingHistorySupermarketDominancePoint {
	supermarket: string;
	totalSpent: number;
	totalItems: number;
	spentPercentage: number;
	itemsPercentage: number;
}

export interface ShoppingHistoryTrendSeries {
	weekly: ShoppingSessionTrendPoint[];
	monthly: ShoppingSessionTrendPoint[];
	yearly: ShoppingSessionTrendPoint[];
}

export interface ShoppingHistoryTicketMetricsSnapshot {
	averageTicketCost: number;
	totalSpentToDate: number;
	totalTickets: number;
	mostFrequentGroceryDay: string | null;
}

export interface ShoppingHistoryInsightsMetricsSnapshot {
	supermarketDominance: ShoppingHistorySupermarketDominancePoint[];
	trends: ShoppingHistoryTrendSeries;
	ticketMetrics: ShoppingHistoryTicketMetricsSnapshot;
}

export interface ShoppingHistoryFormattedTicketMetrics {
	averageTicketCostLabel: string;
	totalSpentToDateLabel: string;
	totalTicketsLabel: string;
	mostFrequentGroceryDayLabel: string;
}

export interface ShoppingHistoryInsightsModel {
	snapshot: ShoppingHistoryInsightsMetricsSnapshot;
	formattedTicketMetrics: ShoppingHistoryFormattedTicketMetrics;
}

export type ShoppingSessionMetricsApiSnapshot =
	GetShoppingSessionMetricsResponse;
