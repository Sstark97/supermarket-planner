export interface CartMergeItem {
	productId: string;
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

export interface CartMergeResponse {
	items: CartMergeItem[];
	totalItems: number;
}

export interface CartMergeGateway {
	merge(items: CartMergeItem[], token: string): Promise<CartMergeResponse>;
}
