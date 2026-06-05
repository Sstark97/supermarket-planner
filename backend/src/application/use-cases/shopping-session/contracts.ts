export interface SaveShoppingSessionItemInput {
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

export interface SaveShoppingSessionInput {
	userId: string;
	shoppedAt: string; // ISO date string from the client
	items: SaveShoppingSessionItemInput[];
}

export interface SaveShoppingSessionResult {
	sessionId: string;
	totalPrice: number;
	itemCount: number;
}

export interface GetShoppingSessionsInput {
	userId: string;
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

export interface GetShoppingSessionsResult {
	sessions: ShoppingSessionHistoryEntry[];
}

export interface DeleteShoppingSessionInput {
	sessionId: string;
	userId: string;
}

export interface DeleteShoppingSessionResult {
	deleted: boolean;
}
