export interface MercadonaSearchRequest {
	query: string;
	offset: number;
	limit: number;
	wh: string;
}

export interface MercadonaPriceInstructions {
	unit_price?: number | string;
	bulk_price?: number | string;
	unit_size?: number | string;
	size_format?: string;
	approx_size?: boolean;
	[key: string]: unknown;
}

export interface MercadonaApiProduct {
	id: string | number;
	display_name?: string;
	thumbnail?: string;
	price_instructions?: MercadonaPriceInstructions;
	[key: string]: unknown;
}

export interface MercadonaSearchResponse {
	results: MercadonaApiProduct[];
	total?: number;
	[key: string]: unknown;
}
