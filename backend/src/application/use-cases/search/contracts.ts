import type { IProduct } from "@domain/entities/IProduct";

export interface SearchProductsInput {
	query?: string;
	category?: string;
	supermarket?: string;
	postalCode?: string;
	sortBy?: "price_asc" | "price_desc";
	limit?: number;
	cursor?: string;
}

export interface TriggerManualScrapeInput {
	query: string;
}

export interface RefreshProductsCatalogInput {
	query: string;
	postalCode: string;
}

export interface SearchResult {
	query: string;
	results: IProduct[];
	warnings: string[];
	totalCount: number;
	nextCursor: string | null;
	source: "database" | "live";
	scrapedAt: string;
	isRefreshing?: boolean;
	refreshReason?: "empty" | "stale";
}
