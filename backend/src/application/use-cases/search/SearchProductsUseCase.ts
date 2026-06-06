import type { SearchProductsUseCasePort } from "@application/ports/incoming/SearchProductsUseCasePort";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { BackgroundRefreshQueuePort } from "@application/ports/outgoing/BackgroundRefreshQueuePort";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { IProduct } from "@domain/entities/IProduct";
import type { SearchProductsInput, SearchResult } from "./contracts";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

export class SearchProductsUseCase implements SearchProductsUseCasePort {
	constructor(
		private readonly productCatalogRepository: ProductCatalogRepository,
		private readonly backgroundRefreshQueue: BackgroundRefreshQueuePort,
		private readonly logger: LoggerPort,
	) {}

	async execute(input: SearchProductsInput): Promise<SearchResult> {
		this.logger.info(
			`[SearchProductsUseCase] execute - query: "${input.query}", category: "${input.category}", supermarket: "${input.supermarket}", sortBy: "${input.sortBy}"`,
		);

		const normalizedQuery = input.query?.trim() ?? "";
		const catalogProducts = await this.productCatalogRepository.find({
			query: normalizedQuery,
			category: input.category,
			supermarket: input.supermarket,
			limit: 500,
		});

		const deduplicatedProducts =
			this.deduplicateBySupermarketAndName(catalogProducts);
		const sortedProducts = this.sortByPrice(deduplicatedProducts, input.sortBy);
		const latestScrapedAt = this.findLatestScrapedAt(catalogProducts);
		const refreshDecision = this.computeRefreshDecision(
			normalizedQuery,
			sortedProducts.length,
			latestScrapedAt,
		);

		const isRefreshing = refreshDecision.shouldRefresh
			? this.backgroundRefreshQueue.enqueue(normalizedQuery)
			: false;

		const effectiveLimit = Math.min(input.limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
		const { pageSlice, nextCursor, totalCount } = this.applyPaginationWindow(
			sortedProducts,
			input.cursor,
			effectiveLimit,
		);

		return {
			query: normalizedQuery,
			results: pageSlice,
			warnings: [],
			totalCount,
			nextCursor,
			source: "database",
			scrapedAt: new Date().toISOString(),
			isRefreshing: isRefreshing || undefined,
			refreshReason: isRefreshing ? refreshDecision.refreshReason : undefined,
		};
	}

	private applyPaginationWindow(
		products: IProduct[],
		cursor: string | undefined,
		limit: number,
	): { pageSlice: IProduct[]; nextCursor: string | null; totalCount: number } {
		const totalCount = products.length;
		const parsedOffset = cursor !== undefined ? parseInt(cursor, 10) : 0;
		const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
		const pageSlice = products.slice(offset, offset + limit);
		const nextCursor = offset + limit < totalCount ? String(offset + limit) : null;
		return { pageSlice, nextCursor, totalCount };
	}

	private normalizeProductName(name: string): string {
		return name
			.toLowerCase()
			.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
			.replace(/\s{2,}/g, " ")
			.trim();
	}

	private deduplicateBySupermarketAndName(products: IProduct[]): IProduct[] {
		const uniqueProductsByStoreAndName = new Map<string, IProduct>();

		for (const product of products) {
			const uniqueKey = `${product.supermarket}:${this.normalizeProductName(product.name)}`;
			const existingProduct = uniqueProductsByStoreAndName.get(uniqueKey);
			if (
				!existingProduct ||
				product.pricePerUnit < existingProduct.pricePerUnit
			) {
				uniqueProductsByStoreAndName.set(uniqueKey, product);
			}
		}

		return Array.from(uniqueProductsByStoreAndName.values());
	}

	private sortByPrice(
		products: IProduct[],
		sortBy?: "price_asc" | "price_desc",
	): IProduct[] {
		const sortedProducts = [...products];
		if (sortBy === "price_desc") {
			sortedProducts.sort((left, right) => right.price - left.price);
			return sortedProducts;
		}

		sortedProducts.sort((left, right) => left.price - right.price);
		return sortedProducts;
	}

	private findLatestScrapedAt(products: IProduct[]): Date | null {
		return products.reduce<Date | null>((latestDate, product) => {
			const scrapedAt = new Date(product.scrapedAt);
			if (!latestDate || scrapedAt > latestDate) {
				return scrapedAt;
			}
			return latestDate;
		}, null);
	}

	private computeRefreshDecision(
		normalizedQuery: string,
		productsCount: number,
		latestScrapedAt: Date | null,
	): { shouldRefresh: boolean; refreshReason?: "empty" | "stale" } {
		if (!normalizedQuery) {
			return { shouldRefresh: false };
		}

		if (productsCount === 0) {
			return { shouldRefresh: true, refreshReason: "empty" };
		}

		const hasStaleData =
			latestScrapedAt !== null &&
			Date.now() - latestScrapedAt.getTime() > STALE_THRESHOLD_MS;
		if (hasStaleData) {
			return { shouldRefresh: true, refreshReason: "stale" };
		}

		return { shouldRefresh: false };
	}
}
