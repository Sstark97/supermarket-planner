export interface AldiAlgoliaHit {
	productName?: string;
	name?: string;
	salesPrice?: number | string;
	price?: number | string;
	salesUnitFormatted?: string;
	sales_unit?: string;
	basePriceValue?: number | string;
	basePriceScale?: string;
	productPicture?: string;
	image_url?: string;
	productUrl?: string;
	url?: string;
}

export interface AldiAlgoliaResultsEntry {
	hits?: AldiAlgoliaHit[];
}

export interface AldiAlgoliaMultiQueryResponse {
	results?: AldiAlgoliaResultsEntry[];
}

export interface CarrefourSearchDoc {
	display_name?: string;
	name?: string;
	active_price?: number | string;
	app_price?: number | string;
	list_price?: number | string;
	image_path?: string;
	image?: string;
	image_url?: string;
	price_per_unit_text?: string;
	url?: string;
}

export interface CarrefourSearchApiResponse {
	content?: {
		docs?: CarrefourSearchDoc[];
	};
}

export interface HiperDinoRawProduct {
	name: string;
	price: string;
	image: string;
	link: string;
	descriptionTexts: string[];
}

export interface LidlRawProduct {
	name: string;
	price: string;
	image: string;
	link: string;
	unit: string;
}

export interface MercadonaDomProduct {
	name: string;
	price: string;
	image: string;
	unit: string;
}

export interface MercadonaPriceInstructions {
	unit_price?: number | string;
	bulk_price?: number | string;
	unit_size?: number | string;
	size_format?: string;
	approx_size?: boolean;
}

export interface MercadonaApiProduct {
	id: string | number;
	display_name?: string;
	thumbnail?: string;
	price_instructions?: MercadonaPriceInstructions;
}

export interface MercadonaSearchResponse {
	results: MercadonaApiProduct[];
	total?: number;
}
