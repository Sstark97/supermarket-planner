export interface MergeCartItemInput {
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

export interface MergeCartInput {
	userId: string;
	items: MergeCartItemInput[];
}

export interface MergeCartResultItem {
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

export interface MergeCartResult {
	cartId: string;
	userId: string;
	totalItems: number;
	items: MergeCartResultItem[];
}
