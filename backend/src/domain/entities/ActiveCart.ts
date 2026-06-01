export interface ActiveCartItem {
	readonly productId: string;
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

export interface ActiveCart {
	readonly id: string;
	readonly userId: string;
	readonly updatedAt: Date;
	readonly items: readonly ActiveCartItem[];
}
