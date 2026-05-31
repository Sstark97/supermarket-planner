import type { IProduct } from "@domain/entities/IProduct";

export interface SearchProductsInput {
	query?: string;
	category?: string;
	supermarket?: string;
	sortBy?: "price_asc" | "price_desc";
}

export interface TriggerManualScrapeInput {
	query: string;
}

export interface SearchResult {
	query: string;
	results: IProduct[];
	warnings: string[];
	totalCount: number;
	source: "database" | "live";
	scrapedAt: string;
	isRefreshing?: boolean;
	refreshReason?: "empty" | "stale";
}
