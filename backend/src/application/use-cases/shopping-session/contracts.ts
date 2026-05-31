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
