import cron from "node-cron";
import { logger } from "@infrastructure/logging/logger";
import type { CategorizePendingProductsUseCase } from "@application/use-cases/categorization/CategorizePendingProductsUseCase";

export class CategorizationCron {
	constructor(
		private readonly categorizePendingProductsUseCase: CategorizePendingProductsUseCase,
	) {}

	public start(): void {
		// Runs every 6 hours; covers the window after the daily scrape at 04:00
		cron.schedule("0 */6 * * *", async () => {
			logger.info("[CRON] Starting scheduled batch categorization of pending products...");
			await this.runBatchCategorization();
		});

		logger.info("[CRON] Batch categorization scheduled every 6 hours.");
	}

	public async runBatchCategorization(): Promise<void> {
		try {
			const result = await this.categorizePendingProductsUseCase.execute();
			logger.info(
				`[CRON] Batch categorization complete — pending: ${result.totalPending}, categorized: ${result.categorized}, failed: ${result.failed}.`,
			);
		} catch (error) {
			logger.error(
				`[CRON] Batch categorization failed: ${String(error)}`,
			);
		}
	}
}
