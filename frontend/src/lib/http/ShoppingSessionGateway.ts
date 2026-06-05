export interface SaveShoppingSessionRequest {
	shoppedAt: string;
	items: Array<{
		productName: string;
		supermarket: string;
		category: string;
		price: number;
		pricePerUnit: number;
		unit: string;
		taxType: string;
		quantity: number;
		image?: string;
		url?: string;
	}>;
}

export interface SaveShoppingSessionResponse {
	sessionId: string;
	totalPrice: number;
	itemCount: number;
}

export interface ShoppingSessionHistoryItem {
	productName: string;
	supermarket: string;
	category: string;
	price: number;
	pricePerUnit: number;
	unit: string;
	taxType: string;
	quantity: number;
	image?: string;
	url?: string;
}

export interface ShoppingSessionHistoryEntry {
	sessionId: string;
	shoppedAt: string;
	totalPrice: number;
	createdAt: string;
	items: ShoppingSessionHistoryItem[];
}

export interface ListShoppingSessionsResponse {
	sessions: ShoppingSessionHistoryEntry[];
}

export interface DeleteShoppingSessionResponse {
	deleted: boolean;
}

export interface ShoppingSessionSupermarketDominanceMetric {
	supermarket: string;
	totalSpent: number;
	totalItems: number;
}

export interface ShoppingSessionTrendPoint {
	period: string;
	amount: number;
}

export interface ShoppingSessionSpendingTrends {
	weeklyAverage: ShoppingSessionTrendPoint[];
	monthlyTotal: ShoppingSessionTrendPoint[];
	yearlyTotal: ShoppingSessionTrendPoint[];
}

export interface ShoppingSessionTicketMetrics {
	averageTicketCost: number;
	totalSpentToDate: number;
	mostFrequentGroceryDay: string | null;
	totalTickets: number;
}

export interface GetShoppingSessionMetricsResponse {
	supermarketDominance: ShoppingSessionSupermarketDominanceMetric[];
	spendingTrends: ShoppingSessionSpendingTrends;
	ticketMetrics: ShoppingSessionTicketMetrics;
}

export interface ShoppingSessionGateway {
	save(
		request: SaveShoppingSessionRequest,
		token: string,
	): Promise<SaveShoppingSessionResponse>;

	list(token: string): Promise<ListShoppingSessionsResponse>;

	delete(
		sessionId: string,
		token: string,
	): Promise<DeleteShoppingSessionResponse>;

	getMetrics(token: string): Promise<GetShoppingSessionMetricsResponse>;
}
