import express from "express";
import cors from "cors";
import { config } from "./config";
import { logger } from "./utils/logger";
import { BrowserManager } from "./infrastructure/adapters/driven/scraping/strategies/BrowserManager";
import { SearchProductsUseCase } from "./application/use-cases/search/SearchProductsUseCase";
import { TriggerManualScrapeUseCase } from "./application/use-cases/search/TriggerManualScrapeUseCase";
import { RefreshProductsCatalogUseCase } from "./application/use-cases/search/RefreshProductsCatalogUseCase";
import { SearchController } from "./controllers/SearchController";
import { errorHandler } from "./middlewares/errorHandler";
import { ScraperCron } from "./cron/scraperCron";
import { PrismaProductRepository } from "./infrastructure/adapters/driven/persistence/prisma/PrismaProductRepository";
import { InMemoryBackgroundRefreshQueueAdapter } from "./infrastructure/adapters/driven/queue/BackgroundRefreshQueue";

import { HiperDinoScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/HiperDinoScraperAdapter";
import { MercadonaScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/MercadonaScraperAdapter";
import { CarrefourScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/CarrefourScraperAdapter";
import { LidlScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/LidlScraperAdapter";
import { AldiScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/AldiScraperAdapter";

async function bootstrap() {
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

	logger.info("Warming up Playwright Chromium browser...");
	await BrowserManager.getInstance().getBrowser();
	logger.info("Browser ready.");

	scraperCron.start();

	app.listen(config.port, () => {
		logger.info(
			`🚀 Antigravity backend running at http://localhost:${config.port}`,
		);
		logger.info(
			`   GET /search?q=<query> — search across ${scrapers.length} supermarkets`,
		);
		logger.info(`   GET /health           — check scraper circuit status`);
	});

	process.on("SIGTERM", async () => {
		logger.info("SIGTERM received. Shutting down...");
		await BrowserManager.getInstance().shutdown();
		process.exit(0);
	});

	process.on("SIGINT", async () => {
		logger.info("SIGINT received. Shutting down...");
		await BrowserManager.getInstance().shutdown();
		process.exit(0);
	});
}

bootstrap().catch((error) => {
	console.error("Fatal startup error:", error);
	process.exit(1);
});
