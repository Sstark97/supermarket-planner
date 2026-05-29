import cors from "cors";
import express, { type Express } from "express";
import { RefreshProductsCatalogUseCase } from "../../application/use-cases/search/RefreshProductsCatalogUseCase";
import { SearchProductsUseCase } from "../../application/use-cases/search/SearchProductsUseCase";
import { TriggerManualScrapeUseCase } from "../../application/use-cases/search/TriggerManualScrapeUseCase";
import { SearchController } from "../../controllers/SearchController";
import { ScraperCron } from "../cron/scraperCron";
import { PrismaProductRepository } from "../adapters/driven/persistence/prisma/PrismaProductRepository";
import { InMemoryBackgroundRefreshQueueAdapter } from "../adapters/driven/queue/BackgroundRefreshQueue";
import { AldiScraperAdapter } from "../adapters/driven/scraping/supermarkets/AldiScraperAdapter";
import { CarrefourScraperAdapter } from "../adapters/driven/scraping/supermarkets/CarrefourScraperAdapter";
import { HiperDinoScraperAdapter } from "../adapters/driven/scraping/supermarkets/HiperDinoScraperAdapter";
import { LidlScraperAdapter } from "../adapters/driven/scraping/supermarkets/LidlScraperAdapter";
import { MercadonaScraperAdapter } from "../adapters/driven/scraping/supermarkets/MercadonaScraperAdapter";
import { logger } from "../logging/logger";
import { errorHandler } from "../http/errorHandler";
import type { PlaywrightScraperAdapterBase } from "../adapters/driven/scraping/PlaywrightScraperAdapterBase";

export interface BootstrappedBackendApplication {
	app: Express;
	scrapers: PlaywrightScraperAdapterBase[];
	scraperCron: ScraperCron;
}

export class BackendCompositionBootstrap {
	static createApplication(): BootstrappedBackendApplication {
		const app = express();
		app.use(cors());
		app.use(express.json());

		const scrapers = [
			new HiperDinoScraperAdapter(),
			new MercadonaScraperAdapter(),
			new CarrefourScraperAdapter(),
			new LidlScraperAdapter(),
			new AldiScraperAdapter(),
		];

		const triggerManualScrapeUseCase = new TriggerManualScrapeUseCase(scrapers);
		const productCatalogRepository = new PrismaProductRepository();
		const refreshProductsCatalogUseCase = new RefreshProductsCatalogUseCase(
			triggerManualScrapeUseCase,
			productCatalogRepository,
		);
		const backgroundRefreshQueue = new InMemoryBackgroundRefreshQueueAdapter(
			async (query) => {
				await refreshProductsCatalogUseCase.execute({ query });
			},
		);
		const searchProductsUseCase = new SearchProductsUseCase(
			productCatalogRepository,
			backgroundRefreshQueue,
		);
		const searchController = new SearchController(searchProductsUseCase);
		const scraperCron = new ScraperCron(
			triggerManualScrapeUseCase,
			productCatalogRepository,
		);

		app.get("/health", (_req, res) => {
			res.json({
				status: "ok",
				dbConnected: true,
				scrapers: scrapers.map((scraper) => {
					const circuit = scraper.getCircuitBreakerStatus();
					return {
						name: scraper.name,
						circuitOpen: scraper.isCircuitOpen,
						circuit,
					};
				}),
			});
		});

		app.get("/search", searchController.search);

		app.post("/admin/scrape/:query", async (req, res) => {
			try {
				const query = req.params.query;
				logger.info(`Manual scrape triggered for: ${query}`);
				const result = await triggerManualScrapeUseCase.execute({ query });
				const savedProductsCount = await productCatalogRepository.save(
					result.results,
				);

				res.json({
					message: `Scraped ${savedProductsCount} products for "${query}"`,
					warnings: result.warnings,
					sample: result.results.slice(0, 10),
				});
			} catch (error) {
				logger.error("Manual scrape failed:", error);
				res.status(500).json({ error: String(error) });
			}
		});

		app.post("/admin/scrape-all", (_req, res) => {
			scraperCron.runDailyScrape().catch((error) => {
				logger.error("Manual scrape-all failed:", error);
			});
			res.json({ message: "Daily scrape full loop triggered in background." });
		});

		app.use(errorHandler);

		return {
			app,
			scrapers,
			scraperCron,
		};
	}
}
