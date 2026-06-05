import type { ShoppingSession } from "@domain/entities/ShoppingSession";

export interface ShoppingSessionTrendPointSnapshot {
	period: string;
	amount: number;
}

export interface ShoppingSessionMetricsSnapshot {
	supermarketDominance: Array<{
		supermarket: string;
		totalSpent: number;
		totalItems: number;
	}>;
	spendingTrends: {
		weeklyAverage: ShoppingSessionTrendPointSnapshot[];
		monthlyTotal: ShoppingSessionTrendPointSnapshot[];
		yearlyTotal: ShoppingSessionTrendPointSnapshot[];
	};
	ticketMetrics: {
		averageTicketCost: number;
		totalSpentToDate: number;
		mostFrequentGroceryDay: string | null;
		totalTickets: number;
	};
}

export interface ShoppingSessionRepository {
	save(session: ShoppingSession): Promise<ShoppingSession>;
	findByUserId(userId: string): Promise<ShoppingSession[]>;
	deleteByIdForUser(sessionId: string, userId: string): Promise<boolean>;
	getMetricsForUser(userId: string): Promise<ShoppingSessionMetricsSnapshot>;
}
