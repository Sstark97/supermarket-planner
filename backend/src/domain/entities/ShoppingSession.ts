export interface ShoppingSessionItem {
	readonly productName: string;
	readonly supermarket: string;
	readonly category: string;
	readonly price: number;
	readonly pricePerUnit: number;
	readonly unit: string;
	readonly taxType: string;
	readonly quantity: number;
	readonly image?: string;
	readonly url?: string;
}

export interface ShoppingSession {
	readonly id: string;
	readonly userId: string;
	readonly shoppedAt: Date;
	readonly totalPrice: number;
	readonly createdAt: Date;
	readonly items: readonly ShoppingSessionItem[];
}
