import type { TriggerManualScrapeUseCasePort } from "../../ports/incoming/TriggerManualScrapeUseCasePort";
import type { SupermarketSearchPort } from "../../ports/outgoing/SupermarketSearchPort";
import type { IProduct } from "../../../interfaces/IProduct";
import { logger } from "../../../utils/logger";
import type { SearchResult, TriggerManualScrapeInput } from "./contracts";

export class TriggerManualScrapeUseCase implements TriggerManualScrapeUseCasePort {
	constructor(private readonly scrapers: SupermarketSearchPort[]) {}

	async execute(input: TriggerManualScrapeInput): Promise<SearchResult> {
		const query = input.query;
		const scrapedAt = new Date().toISOString();
		const warnings: string[] = [];

		logger.info(
			`[TriggerManualScrapeUseCase] Starting parallel scrapers for: "${query}"`,
		);
		const searchStartedAt = Date.now();

		const scraperTasks = this.scrapers.map(async (scraper) => {
			const scraperStartedAt = Date.now();
			try {
				const results = await scraper.search(query);
				logger.info(
					`[TriggerManualScrapeUseCase] ${scraper.name} completed: ${results.length} results in ${Date.now() - scraperStartedAt}ms`,
				);
				return results;
			} catch (error) {
				logger.error(
					`[TriggerManualScrapeUseCase] ${scraper.name} failed after ${Date.now() - scraperStartedAt}ms: ${error}`,
				);
				throw error;
			}
		});

		const settledResults = await Promise.allSettled(scraperTasks);
		logger.info(
			`[TriggerManualScrapeUseCase] All scrapers finished in ${Date.now() - searchStartedAt}ms.`,
		);

		const results: IProduct[] = [];
		settledResults.forEach((outcome, index) => {
			const scraperName = this.scrapers[index].name;
			if (outcome.status === "fulfilled") {
				results.push(...outcome.value);
				return;
			}

			const rejectionReason = this.formatRejectionReason(outcome.reason);
			logger.error(
				`[TriggerManualScrapeUseCase] ${scraperName} rejected: ${rejectionReason}`,
			);
			warnings.push(`${scraperName}: ${rejectionReason}`);
		});

		results.sort((left, right) => left.pricePerUnit - right.pricePerUnit);

		return {
			query,
			results,
			warnings,
			totalCount: results.length,
			source: "live",
			scrapedAt,
		};
	}

	private formatRejectionReason(reason: unknown): string {
		if (reason instanceof Error) return reason.message;
		if (typeof reason === "string") return reason;
		try {
			return JSON.stringify(reason);
		} catch {
			return String(reason);
		}
	}
}
