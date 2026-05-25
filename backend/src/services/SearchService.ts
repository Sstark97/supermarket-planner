import type { IScraper } from "../interfaces/IScraper";
import type { IProduct } from "../interfaces/IProduct";
import { logger } from "../utils/logger";
import { prisma } from "../db/prisma";
import { BackgroundRefreshQueue } from "./BackgroundRefreshQueue";

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

export class SearchService {
	private readonly refreshQueue: BackgroundRefreshQueue;

	constructor(private readonly scrapers: IScraper[]) {
		this.refreshQueue = new BackgroundRefreshQueue(
			this.refreshQueryInBackground,
		);
	}

	private readonly refreshQueryInBackground = async (
		query: string,
	): Promise<void> => {
		logger.info(
			`[SearchService] Background refresh started for query: "${query}"`,
		);
		const liveResult = await this.search(query);

		let saved = 0;
		for (const product of liveResult.results) {
			await prisma.product.create({
				data: {
					name: product.name,
					supermarket: product.supermarket,
					category: product.category,
					price: product.price,
					pricePerUnit: product.pricePerUnit,
					unit: product.unit,
					image: product.image,
					url: product.url,
					taxType: product.taxType,
					scrapedAt: new Date(product.scrapedAt),
				},
			});
			saved++;
		}

		logger.info(
			`[SearchService] Background refresh completed for "${query}". Saved: ${saved}. Warnings: ${liveResult.warnings.length}`,
		);
	};

	requestBackgroundRefresh(query: string): boolean {
		return this.refreshQueue.enqueue(query);
	}

	/**
	 * Used by the Frontend API. Queries PostgreSQL and decides if data should
	 * be refreshed asynchronously (cache-aside pattern).
	 */
	async searchFromDatabase(
		query?: string,
		category?: string,
		supermarket?: string,
		sortBy?: string,
	): Promise<DatabaseSearchResult> {
		logger.info(
			`[SearchService] searchFromDatabase - query: "${query}", category: "${category}", supermarket: "${supermarket}", sortBy: "${sortBy}"`,
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

		const uniqueMap = new Map<string, (typeof rawResults)[number]>();
		const normalizeName = (name: string) =>
			name
				.toLowerCase()
				.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
				.replace(/\s{2,}/g, " ")
				.trim();

		rawResults.forEach((p) => {
			const key = `${p.supermarket}:${normalizeName(p.name)}`;
			if (
				!uniqueMap.has(key) ||
				p.pricePerUnit < uniqueMap.get(key)!.pricePerUnit
			) {
				uniqueMap.set(key, p);
			}
		});

		const results: IProduct[] = Array.from(uniqueMap.values()).map((p) => ({
			id: p.id,
			name: p.name,
			supermarket: p.supermarket,
			category: p.category as IProduct["category"],
			price: p.price,
			pricePerUnit: p.pricePerUnit,
			unit: p.unit,
			image: p.image || undefined,
			url: p.url || undefined,
			taxType: p.taxType as IProduct["taxType"],
			scrapedAt: p.scrapedAt.toISOString(),
		}));

		if (sortBy === "price_desc") {
			results.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
		} else {
			results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
		}

		const isStale =
			latestScrapedAt !== null &&
			Date.now() - latestScrapedAt.getTime() > STALE_THRESHOLD_MS;
		const shouldRefresh =
			Boolean(normalizedQuery) && (results.length === 0 || isStale);

		return {
			query: normalizedQuery,
			results,
			warnings: [],
			totalCount: results.length,
			source: "database",
			scrapedAt: new Date().toISOString(),
			needsBackgroundRefresh: shouldRefresh,
			refreshReason: shouldRefresh
				? results.length === 0
					? "empty"
					: "stale"
				: undefined,
		};
	}

	/**
	 * Used by Cron and manual scraping to actually scrape live websites.
	 */
	async search(query: string): Promise<SearchResult> {
		const scrapedAt = new Date().toISOString();
		const warnings: string[] = [];

		logger.info(`[SearchService] Starting parallel scrapers for: "${query}"`);
		const start = Date.now();

		const scraperTasks = this.scrapers.map(async (scraper) => {
			const scraperStart = Date.now();
			try {
				const results = await scraper.search(query);
				logger.info(
					`[SearchService] ${scraper.name} completed: ${results.length} results in ${Date.now() - scraperStart}ms`,
				);
				return results;
			} catch (err) {
				logger.error(
					`[SearchService] ${scraper.name} failed after ${Date.now() - scraperStart}ms: ${err}`,
				);
				throw err;
			}
		});

		const settled = await Promise.allSettled(scraperTasks);
		const totalTime = Date.now() - start;
		logger.info(`[SearchService] All scrapers finished in ${totalTime}ms.`);

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

		settled.forEach((outcome, index) => {
			const scraperName = this.scrapers[index].name;
			if (outcome.status === "fulfilled") {
				results.push(...outcome.value);
			} else {
				const reason = formatRejectionReason(
					(outcome as PromiseRejectedResult).reason,
				);
				logger.error(`[SearchService] ${scraperName} rejected: ${reason}`);
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
