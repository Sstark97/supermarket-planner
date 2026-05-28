import cron from "node-cron";
import { logger } from "../utils/logger";
import type { TriggerManualScrapeUseCasePort } from "../application/ports/incoming/TriggerManualScrapeUseCasePort";
import type { ProductCatalogRepository } from "../application/ports/outgoing/ProductCatalogRepository";

// Essential weekly shopping queries to track broadly
const CRON_QUERIES = [
	"leche",
	"pan",
	"huevos",
	"aceite de oliva",
	"pollo",
	"cerdo",
	"merluza",
	"platanos",
	"tomates",
	"cebollas",
	"patatas",
	"arroz",
	"pasta",
	"yogur",
	"queso",
	"agua mineral",
	"papel higiénico",
	"gel de ducha",
	"detergente",
	"lejía",
];

export class ScraperCron {
	constructor(
		private readonly triggerManualScrapeUseCase: TriggerManualScrapeUseCasePort,
		private readonly productCatalogRepository: ProductCatalogRepository,
	) {}

	public start() {
		cron.schedule("0 4 * * *", async () => {
			logger.info("🕒 [CRON] Starting daily supermarket scrape...");
			await this.runDailyScrape();
		});

		logger.info("🕒 [CRON] Daily scraper scheduled for 04:00 AM.");
	}

	public async runDailyScrape() {
		const startTime = Date.now();
		let totalProductsSaved = 0;

		for (const query of CRON_QUERIES) {
			logger.info(`[CRON] Scraping predefined query: "${query}"`);
			try {
				const result = await this.triggerManualScrapeUseCase.execute({
					query,
				});
				const savedProductsCount = await this.productCatalogRepository.save(
					result.results,
				);
				totalProductsSaved += savedProductsCount;

				logger.info(
					`[CRON] Saved ${savedProductsCount} products for "${query}".`,
				);

				await new Promise((resolve) => setTimeout(resolve, 5000));
			} catch (error) {
				logger.error(`[CRON] Error during query "${query}": ${String(error)}`);
			}
		}

		const durationMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
		logger.info(
			`🕒 [CRON] Daily scrape completed in ${durationMinutes} minutes. Total saved: ${totalProductsSaved}`,
		);
	}
}
