import { config } from "./infrastructure/config/index";
import { BackendCompositionBootstrap } from "./infrastructure/composition/bootstrap";
import { BrowserManager } from "./infrastructure/adapters/driven/scraping/strategies/BrowserManager";
import { logger } from "./infrastructure/logging/logger";

async function bootstrap() {
	const { app, scrapers, scraperCron } =
		BackendCompositionBootstrap.createApplication();

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
