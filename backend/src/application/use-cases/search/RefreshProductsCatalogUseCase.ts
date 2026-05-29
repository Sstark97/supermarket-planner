import type { TriggerManualScrapeUseCasePort } from "../../ports/incoming/TriggerManualScrapeUseCasePort";
import type { ProductCatalogRepository } from "../../ports/outgoing/ProductCatalogRepository";
import { logger } from "../../../infrastructure/logging/logger";
import type { TriggerManualScrapeInput } from "./contracts";

export class RefreshProductsCatalogUseCase {
	constructor(
		private readonly triggerManualScrapeHandler: TriggerManualScrapeUseCasePort,
		private readonly productCatalogRepository: ProductCatalogRepository,
	) {}

	async execute(input: TriggerManualScrapeInput): Promise<void> {
		logger.info(
			`[RefreshProductsCatalogUseCase] Background refresh started for query: "${input.query}"`,
		);
		const liveResult = await this.triggerManualScrapeHandler.execute({
			query: input.query,
		});
		const savedProductsCount = await this.productCatalogRepository.save(
			liveResult.results,
		);

		logger.info(
			`[RefreshProductsCatalogUseCase] Background refresh completed for "${input.query}". Saved: ${savedProductsCount}. Warnings: ${liveResult.warnings.length}`,
		);
	}
}
