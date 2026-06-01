import cors from "cors";
import express, { type Express } from "express";
import { RefreshProductsCatalogUseCase } from "@application/use-cases/search/RefreshProductsCatalogUseCase";
import { SearchProductsUseCase } from "@application/use-cases/search/SearchProductsUseCase";
import { TriggerManualScrapeUseCase } from "@application/use-cases/search/TriggerManualScrapeUseCase";
import { SaveShoppingSessionUseCase } from "@application/use-cases/shopping-session/SaveShoppingSessionUseCase";
import { MergeCartUseCase } from "@application/use-cases/active-cart/MergeCartUseCase";
import { SearchController } from "@infrastructure/adapters/driving/http/SearchController";
import { ShoppingSessionController } from "@infrastructure/adapters/driving/http/ShoppingSessionController";
import { ActiveCartController } from "@infrastructure/adapters/driving/http/ActiveCartController";
import { JwtAuthMiddleware } from "@infrastructure/adapters/driving/http/middleware/JwtAuthMiddleware";
import { ScraperCron } from "@infrastructure/adapters/driving/cron/scraperCron";
import { PrismaProductRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaProductRepository";
import { PrismaShoppingSessionRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository";
import { PrismaActiveCartRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaActiveCartRepository";
import { InMemoryBackgroundRefreshQueueAdapter } from "@infrastructure/adapters/driven/queue/BackgroundRefreshQueue";
import { AldiScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/AldiScraperAdapter";
import { CarrefourScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/CarrefourScraperAdapter";
import { HiperDinoScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/HiperDinoScraperAdapter";
import { LidlScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/LidlScraperAdapter";
import { MercadonaScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/MercadonaScraperAdapter";
import { logger } from "@infrastructure/logging/logger";
import { errorHandler } from "@infrastructure/adapters/driving/http/errorHandler";
import { config } from "@infrastructure/config";
import type { PlaywrightScraperAdapterBase } from "@infrastructure/adapters/driven/scraping/PlaywrightScraperAdapterBase";

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

		const triggerManualScrapeUseCase = new TriggerManualScrapeUseCase(
			scrapers,
			logger,
		);
		const productCatalogRepository = new PrismaProductRepository();
		const refreshProductsCatalogUseCase = new RefreshProductsCatalogUseCase(
			triggerManualScrapeUseCase,
			productCatalogRepository,
			logger,
		);
		const backgroundRefreshQueue = new InMemoryBackgroundRefreshQueueAdapter(
			async (query) => {
				await refreshProductsCatalogUseCase.execute({ query });
			},
		);
		const searchProductsUseCase = new SearchProductsUseCase(
			productCatalogRepository,
			backgroundRefreshQueue,
			logger,
		);
		const searchController = new SearchController(searchProductsUseCase);
		const scraperCron = new ScraperCron(
			triggerManualScrapeUseCase,
			productCatalogRepository,
		);

		const shoppingSessionRepository = new PrismaShoppingSessionRepository();
		const saveShoppingSessionUseCase = new SaveShoppingSessionUseCase(
			shoppingSessionRepository,
			logger,
		);
		const shoppingSessionController = new ShoppingSessionController(
			saveShoppingSessionUseCase,
		);

		const activeCartRepository = new PrismaActiveCartRepository();
		const mergeCartUseCase = new MergeCartUseCase(activeCartRepository, logger);
		const activeCartController = new ActiveCartController(mergeCartUseCase);

		const jwtAuthMiddleware = new JwtAuthMiddleware(config.authSecret, logger);

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

		app.post(
			"/api/shopping-sessions",
			jwtAuthMiddleware.authenticate,
			shoppingSessionController.save,
		);

		app.post(
			"/api/cart/merge",
			jwtAuthMiddleware.authenticate,
			activeCartController.merge,
		);

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
