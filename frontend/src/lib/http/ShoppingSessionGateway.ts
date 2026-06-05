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
}
