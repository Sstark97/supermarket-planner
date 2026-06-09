import cors from "cors";
import express, { type Express } from "express";
import { z } from "zod";
import { RefreshProductsCatalogUseCase } from "@application/use-cases/search/RefreshProductsCatalogUseCase";
import { SearchProductsUseCase } from "@application/use-cases/search/SearchProductsUseCase";
import { TriggerManualScrapeUseCase } from "@application/use-cases/search/TriggerManualScrapeUseCase";
import { SaveShoppingSessionUseCase } from "@application/use-cases/shopping-session/SaveShoppingSessionUseCase";
import { GetShoppingSessionsUseCase } from "@application/use-cases/shopping-session/GetShoppingSessionsUseCase";
import { DeleteShoppingSessionUseCase } from "@application/use-cases/shopping-session/DeleteShoppingSessionUseCase";
import { GetShoppingSessionMetricsUseCase } from "@application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase";
import { MergeCartUseCase } from "@application/use-cases/active-cart/MergeCartUseCase";
import { CategorizePendingProductsUseCase } from "@application/use-cases/categorization/CategorizePendingProductsUseCase";
import { SearchController } from "@infrastructure/adapters/driving/http/SearchController";
import { ShoppingSessionController } from "@infrastructure/adapters/driving/http/ShoppingSessionController";
import { ActiveCartController } from "@infrastructure/adapters/driving/http/ActiveCartController";
import { AdminCategorizationController } from "@infrastructure/adapters/driving/http/AdminCategorizationController";
import { JwtAuthMiddleware } from "@infrastructure/adapters/driving/http/middleware/JwtAuthMiddleware";
import { ScraperCron } from "@infrastructure/adapters/driving/cron/scraperCron";
import { CategorizationCron } from "@infrastructure/adapters/driving/cron/CategorizationCron";
import { PrismaProductRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaProductRepository";
import { PrismaCategoryCacheRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaCategoryCacheRepository";
import { PrismaShoppingSessionRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository";
import { PrismaActiveCartRepository } from "@infrastructure/adapters/driven/persistence/prisma/PrismaActiveCartRepository";
import { InMemoryBackgroundRefreshQueueAdapter } from "@infrastructure/adapters/driven/queue/BackgroundRefreshQueue";
import { PrismaQueueAdapter } from "@infrastructure/adapters/driven/queue/PrismaQueueAdapter";
import { AldiScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/AldiScraperAdapter";
import { CarrefourScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/CarrefourScraperAdapter";
import { HiperDinoScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/HiperDinoScraperAdapter";
import { LidlScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/LidlScraperAdapter";
import { MercadonaScraperAdapter } from "@infrastructure/adapters/driven/scraping/supermarkets/MercadonaScraperAdapter";
import { GeminiAiBatchCategorizer } from "@infrastructure/adapters/driven/ai/GeminiAiBatchCategorizer";
import { logger } from "@infrastructure/logging/logger";
import { errorHandler } from "@infrastructure/adapters/driving/http/errorHandler";
import { config } from "@infrastructure/config";
import type { QueuePort } from "@domain/ports/QueuePort";
import type { PlaywrightScraperAdapterBase } from "@infrastructure/adapters/driven/scraping/PlaywrightScraperAdapterBase";

const adminScrapeBodySchema = z.object({
	postalCode: z.string().min(1).optional(),
});

export interface BootstrappedBackendApplication {
	app: Express;
	scrapers: PlaywrightScraperAdapterBase[];
	scraperCron: ScraperCron;
	categorizationCron: CategorizationCron;
	zoneOnboardingQueue: QueuePort;
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
		const zoneOnboardingQueue: QueuePort = new PrismaQueueAdapter();
		const productCatalogRepository = new PrismaProductRepository();
		const refreshProductsCatalogUseCase = new RefreshProductsCatalogUseCase(
			triggerManualScrapeUseCase,
			productCatalogRepository,
			logger,
		);
		const backgroundRefreshQueue = new InMemoryBackgroundRefreshQueueAdapter(
			async (query, postalCode) => {
				await refreshProductsCatalogUseCase.execute({ query, postalCode });
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

		const categoryCacheRepository = new PrismaCategoryCacheRepository();
		const aiBatchCategorizer = new GeminiAiBatchCategorizer({
			apiKey: config.geminiApiKey,
			model: config.geminiModel,
			logger,
		});
		const categorizePendingProductsUseCase =
			new CategorizePendingProductsUseCase({
				productCatalogRepository,
				categoryCacheRepository,
				aiBatchCategorizer,
				logger,
			});
		const adminCategorizationController = new AdminCategorizationController(
			categorizePendingProductsUseCase,
		);
		const categorizationCron = new CategorizationCron(
			categorizePendingProductsUseCase,
		);

		const shoppingSessionRepository = new PrismaShoppingSessionRepository();
		const saveShoppingSessionUseCase = new SaveShoppingSessionUseCase(
			shoppingSessionRepository,
			logger,
		);
		const getShoppingSessionsUseCase = new GetShoppingSessionsUseCase(
			shoppingSessionRepository,
			logger,
		);
		const getShoppingSessionMetricsUseCase =
			new GetShoppingSessionMetricsUseCase(shoppingSessionRepository, logger);
		const deleteShoppingSessionUseCase = new DeleteShoppingSessionUseCase(
			shoppingSessionRepository,
			logger,
		);
		const shoppingSessionController = new ShoppingSessionController(
			saveShoppingSessionUseCase,
			getShoppingSessionsUseCase,
			getShoppingSessionMetricsUseCase,
			deleteShoppingSessionUseCase,
		);

		const activeCartRepository = new PrismaActiveCartRepository();
		const mergeCartUseCase = new MergeCartUseCase(activeCartRepository, logger);
		const activeCartController = new ActiveCartController(mergeCartUseCase);

		const jwtAuthMiddleware = new JwtAuthMiddleware(config.authSecret, logger);

		app.get("/health", (_request, response) => {
			response.json({
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

		app.get(
			"/api/shopping-sessions/metrics",
			jwtAuthMiddleware.authenticate,
			shoppingSessionController.getMetrics,
		);

		app.get(
			"/api/shopping-sessions",
			jwtAuthMiddleware.authenticate,
			shoppingSessionController.get,
		);

		app.post(
			"/api/shopping-sessions",
			jwtAuthMiddleware.authenticate,
			shoppingSessionController.save,
		);

		app.delete(
			"/api/shopping-sessions/:id",
			jwtAuthMiddleware.authenticate,
			shoppingSessionController.delete,
		);

		app.post(
			"/api/cart/merge",
			jwtAuthMiddleware.authenticate,
			activeCartController.merge,
		);

		app.post("/admin/scrape/:query", async (request, response) => {
			try {
				const query = request.params.query;
				const parsedBody = adminScrapeBodySchema.safeParse(request.body);
				const postalCode = parsedBody.success
					? (parsedBody.data.postalCode ?? config.postalCode)
					: config.postalCode;
				logger.info(`Manual scrape triggered for: ${query} (postalCode: ${postalCode})`);
				const result = await triggerManualScrapeUseCase.execute({ query, postalCode });
				const savedProductsCount = await productCatalogRepository.save(
					result.results,
					postalCode,
				);

				response.json({
					message: `Scraped ${savedProductsCount} products for "${query}"`,
					warnings: result.warnings,
					sample: result.results.slice(0, 10),
				});
			} catch (error) {
				logger.error("Manual scrape failed:", error);
				response.status(500).json({ error: String(error) });
			}
		});

		app.post("/admin/scrape-all", (_request, response) => {
			scraperCron.runDailyScrape().catch((error) => {
				logger.error("Manual scrape-all failed:", error);
			});
			response.json({
				message: "Daily scrape full loop triggered in background.",
			});
		});

		app.post(
			"/admin/categorize-pending",
			adminCategorizationController.categorizePending,
		);

		app.use(errorHandler);

		return {
			app,
			scrapers,
			scraperCron,
			categorizationCron,
			zoneOnboardingQueue,
		};
	}
}
