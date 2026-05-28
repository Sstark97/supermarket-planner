import type { SupermarketSearchPort } from "../../ports/outgoing/SupermarketSearchPort";
import type { IProduct } from "../../../interfaces/IProduct";
import { logger } from "../../../utils/logger";
import { prisma } from "../../../db/prisma";
import { buildProductSku } from "../../../utils/ProductIdentity";
import { BackgroundRefreshQueue } from "../../../infrastructure/adapters/driven/queue/BackgroundRefreshQueue";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export interface SearchResult {
	query: string;
	results: IProduct[];
	warnings: string[];
	totalCount: number;
	source: "database" | "live";
	scrapedAt: string;
	isRefreshing?: boolean;
}

export interface DatabaseSearchResult extends SearchResult {
	needsBackgroundRefresh: boolean;
	refreshReason?: "empty" | "stale";
}

export class SearchProductsUseCase {
	private readonly refreshQueue: BackgroundRefreshQueue;

	constructor(private readonly scrapers: SupermarketSearchPort[]) {
		this.refreshQueue = new BackgroundRefreshQueue(
			this.refreshQueryInBackground,
		);
	}

	private readonly refreshQueryInBackground = async (
		query: string,
	): Promise<void> => {
		logger.info(
			`[SearchProductsUseCase] Background refresh started for query: "${query}"`,
		);
		const liveResult = await this.search(query);

		let savedProductsCount = 0;
		for (const product of liveResult.results) {
			const sku = buildProductSku(product);
			await prisma.product.upsert({
				where: {
					supermarket_sku: {
						supermarket: product.supermarket,
						sku,
					},
				},
				update: {
					name: product.name,
					category: product.category,
					price: product.price,
					pricePerUnit: product.pricePerUnit,
					unit: product.unit,
					image: product.image,
					url: product.url,
					taxType: product.taxType,
					scrapedAt: new Date(product.scrapedAt),
				},
				create: {
					name: product.name,
					supermarket: product.supermarket,
					category: product.category,
					sku,
					price: product.price,
					pricePerUnit: product.pricePerUnit,
					unit: product.unit,
					image: product.image,
					url: product.url,
					taxType: product.taxType,
					scrapedAt: new Date(product.scrapedAt),
				},
			});
			savedProductsCount++;
		}

		logger.info(
			`[SearchProductsUseCase] Background refresh completed for "${query}". Saved: ${savedProductsCount}. Warnings: ${liveResult.warnings.length}`,
		);
	};

	requestBackgroundRefresh(query: string): boolean {
		return this.refreshQueue.enqueue(query);
	}

	async searchFromDatabase(
		query?: string,
		category?: string,
		supermarket?: string,
		sortBy?: string,
	): Promise<DatabaseSearchResult> {
		logger.info(
			`[SearchProductsUseCase] searchFromDatabase - query: "${query}", category: "${category}", supermarket: "${supermarket}", sortBy: "${sortBy}"`,
		);

		const normalizedQuery = query?.trim() ?? "";

		const rawResults = await prisma.product.findMany({
			where: {
				...(normalizedQuery
					? {
							name: {
								contains: normalizedQuery,
								mode: "insensitive",
							},
						}
					: {}),
				...(category ? { category } : {}),
				...(supermarket ? { supermarket } : {}),
			},
			take: 500,
		});

		const latestScrapedAt = rawResults.reduce<Date | null>((latest, item) => {
			if (!latest || item.scrapedAt > latest) return item.scrapedAt;
			return latest;
		}, null);

		const uniqueProductsByStoreAndName = new Map<
			string,
			(typeof rawResults)[number]
		>();
		const normalizeName = (name: string) =>
			name
				.toLowerCase()
				.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
				.replace(/\s{2,}/g, " ")
				.trim();

		rawResults.forEach((productRow) => {
			const uniqueKey = `${productRow.supermarket}:${normalizeName(productRow.name)}`;
			if (
				!uniqueProductsByStoreAndName.has(uniqueKey) ||
				productRow.pricePerUnit <
					uniqueProductsByStoreAndName.get(uniqueKey)!.pricePerUnit
			) {
				uniqueProductsByStoreAndName.set(uniqueKey, productRow);
			}
		});

		const results: IProduct[] = Array.from(
			uniqueProductsByStoreAndName.values(),
		).map((productRow) => ({
			id: productRow.id,
			name: productRow.name,
			supermarket: productRow.supermarket,
			category: productRow.category as IProduct["category"],
			price: productRow.price,
			pricePerUnit: productRow.pricePerUnit,
			unit: productRow.unit,
			image: productRow.image || undefined,
			url: productRow.url || undefined,
			taxType: productRow.taxType as IProduct["taxType"],
			scrapedAt: productRow.scrapedAt.toISOString(),
		}));

		if (sortBy === "price_desc") {
			results.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
		} else {
			results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
		}

		const hasStaleData =
			latestScrapedAt !== null &&
			Date.now() - latestScrapedAt.getTime() > STALE_THRESHOLD_MS;
		const shouldRefreshInBackground =
			Boolean(normalizedQuery) && (results.length === 0 || hasStaleData);

		return {
			query: normalizedQuery,
			results,
			warnings: [],
			totalCount: results.length,
			source: "database",
			scrapedAt: new Date().toISOString(),
			needsBackgroundRefresh: shouldRefreshInBackground,
			refreshReason: shouldRefreshInBackground
				? results.length === 0
					? "empty"
					: "stale"
				: undefined,
		};
	}

	async search(query: string): Promise<SearchResult> {
		const scrapedAt = new Date().toISOString();
		const warnings: string[] = [];

		logger.info(
			`[SearchProductsUseCase] Starting parallel scrapers for: "${query}"`,
		);
		const searchStartedAt = Date.now();

		const scraperTasks = this.scrapers.map(async (scraper) => {
			const scraperStartedAt = Date.now();
			try {
				const results = await scraper.search(query);
				logger.info(
					`[SearchProductsUseCase] ${scraper.name} completed: ${results.length} results in ${Date.now() - scraperStartedAt}ms`,
				);
				return results;
			} catch (error) {
				logger.error(
					`[SearchProductsUseCase] ${scraper.name} failed after ${Date.now() - scraperStartedAt}ms: ${error}`,
				);
				throw error;
			}
		});

		const settledResults = await Promise.allSettled(scraperTasks);
		const totalElapsedMs = Date.now() - searchStartedAt;
		logger.info(
			`[SearchProductsUseCase] All scrapers finished in ${totalElapsedMs}ms.`,
		);

		const results: IProduct[] = [];

		const formatRejectionReason = (reason: unknown): string => {
			if (reason instanceof Error) return reason.message;
			if (typeof reason === "string") return reason;
			try {
				return JSON.stringify(reason);
			} catch {
				return String(reason);
			}
		};

		settledResults.forEach((outcome, index) => {
			const scraperName = this.scrapers[index].name;
			if (outcome.status === "fulfilled") {
				results.push(...outcome.value);
			} else {
				const reason = formatRejectionReason(outcome.reason);
				logger.error(
					`[SearchProductsUseCase] ${scraperName} rejected: ${reason}`,
				);
				warnings.push(`${scraperName}: ${reason}`);
			}
		});

		results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);

		return {
			query,
			results,
			warnings,
			totalCount: results.length,
			source: "live",
			scrapedAt,
		};
	}
}
