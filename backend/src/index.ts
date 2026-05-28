import express from "express";
import cors from "cors";
import { config } from "./config";
import { logger } from "./utils/logger";
import { BrowserManager } from "./infrastructure/adapters/driven/scraping/strategies/BrowserManager";
import { SearchProductsUseCase } from "./application/use-cases/search/SearchProductsUseCase";
import { SearchController } from "./controllers/SearchController";
import { errorHandler } from "./middlewares/errorHandler";
import { ScraperCron } from "./cron/scraperCron";
import { prisma } from "./db/prisma";
import { buildProductSku } from "./utils/ProductIdentity";

// Scraper implementations
import { HiperDinoScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/HiperDinoScraperAdapter";
import { MercadonaScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/MercadonaScraperAdapter";
import { CarrefourScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/CarrefourScraperAdapter";
import { LidlScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/LidlScraperAdapter";
import { AldiScraperAdapter } from "./infrastructure/adapters/driven/scraping/supermarkets/AldiScraperAdapter";

async function bootstrap() {
	const app = express();

	app.use(cors());
	app.use(express.json());

	// --- Register all scrapers here (OCP: just add new ones to this array) ---
	const scrapers = [
		new HiperDinoScraperAdapter(),
		new MercadonaScraperAdapter(),
		new CarrefourScraperAdapter(),
		new LidlScraperAdapter(),
		new AldiScraperAdapter(),
	];

	const searchProductsUseCase = new SearchProductsUseCase(scrapers);
	const searchController = new SearchController(searchProductsUseCase);
	const scraperCron = new ScraperCron(searchProductsUseCase);

	// --- Routes ---
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
			const q = req.params.query;
			logger.info(`Manual scrape triggered for: ${q}`);
			const result = await searchProductsUseCase.search(q);

			let saved = 0;
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
				saved++;
			}
			res.json({
				message: `Scraped ${saved} products for "${q}"`,
				warnings: result.warnings,
				sample: result.results.slice(0, 10),
			});
		} catch (err) {
			logger.error("Manual scrape failed:", err);
			res.status(500).json({ error: String(err) });
		}
	});

	app.post("/admin/scrape-all", (_req, res) => {
		// Run in background so we don't timeout the request
		scraperCron.runDailyScrape().catch((err) => {
			logger.error("Manual scrape-all failed:", err);
		});
		res.json({ message: "Daily scrape full loop triggered in background." });
	});

	// Global error handler (must be last)
	app.use(errorHandler);

	// --- Start browser (warm-up) ---
	logger.info("Warming up Playwright Chromium browser...");
	await BrowserManager.getInstance().getBrowser();
	logger.info("Browser ready.");

	// --- Start Cron Jobs ---
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

	// Graceful shutdown
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

bootstrap().catch((err) => {
	console.error("Fatal startup error:", err);
	process.exit(1);
});
