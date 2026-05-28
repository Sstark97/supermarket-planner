import cron from "node-cron";
import { logger } from "../utils/logger";
import type { SearchProductsUseCase } from "../application/use-cases/search/SearchProductsUseCase";
import { prisma } from "../db/prisma";
import { buildProductSku } from "../utils/ProductIdentity";

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
	constructor(private readonly searchProductsUseCase: SearchProductsUseCase) {}

	public start() {
		// Run at 04:00 AM every day (Canary Islands time if server time is correctly set)
		cron.schedule("0 4 * * *", async () => {
			logger.info("🕒 [CRON] Starting daily supermarket scrape...");
			await this.runDailyScrape();
		});

		logger.info("🕒 [CRON] Daily scraper scheduled for 04:00 AM.");
	}

	/**
	 * Can be invoked manually (e.g. from an admin endpoint or CLI)
	 */
	public async runDailyScrape() {
		const startTime = Date.now();
		let totalProductsSaved = 0;

		for (const query of CRON_QUERIES) {
			logger.info(`[CRON] Scraping predefined query: "${query}"`);
			try {
				const result = await this.searchProductsUseCase.search(query);

				// Save to PostgreSQL (idempotent upsert)
				for (const p of result.results) {
					const sku = buildProductSku(p);
					await prisma.product.upsert({
						where: {
							supermarket_sku: {
								supermarket: p.supermarket,
								sku,
							},
						},
						update: {
							name: p.name,
							category: p.category,
							price: p.price,
							pricePerUnit: p.pricePerUnit,
							unit: p.unit,
							image: p.image,
							url: p.url,
							taxType: p.taxType,
							scrapedAt: new Date(p.scrapedAt),
						},
						create: {
							name: p.name,
							supermarket: p.supermarket,
							category: p.category,
							sku,
							price: p.price,
							pricePerUnit: p.pricePerUnit,
							unit: p.unit,
							image: p.image,
							url: p.url,
							taxType: p.taxType,
							scrapedAt: new Date(p.scrapedAt),
						},
					});
					totalProductsSaved++;
				}

				logger.info(
					`[CRON] Saved ${result.results.length} products for "${query}".`,
				);

				// Small delay between generic queries to be nice to servers
				await new Promise((r) => setTimeout(r, 5000));
			} catch (err) {
				logger.error(`[CRON] Error during query "${query}": ${String(err)}`);
			}
		}

		const durationOpt = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
		logger.info(
			`🕒 [CRON] Daily scrape completed in ${durationOpt} minutes. Total saved: ${totalProductsSaved}`,
		);
	}

	/**
	 * Utility to wipe old data before a new daily scrape (optional, keeps DB clean of historic data)
	 * Run this before runDailyScrape if you only care about today's prices.
	 */
	public async clearOldData() {
		const deleted = await prisma.product.deleteMany({});
		logger.info(`[CRON] Wiped ${deleted.count} old products from database.`);
	}
}
