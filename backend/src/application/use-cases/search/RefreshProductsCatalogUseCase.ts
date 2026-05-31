import type { TriggerManualScrapeUseCasePort } from "@application/ports/incoming/TriggerManualScrapeUseCasePort";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { TriggerManualScrapeInput } from "./contracts";

export class RefreshProductsCatalogUseCase {
	constructor(
		private readonly triggerManualScrapeHandler: TriggerManualScrapeUseCasePort,
		private readonly productCatalogRepository: ProductCatalogRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(input: TriggerManualScrapeInput): Promise<void> {
		this.logger.info(
			`[RefreshProductsCatalogUseCase] Background refresh started for query: "${input.query}"`,
		);
		const liveResult = await this.triggerManualScrapeHandler.execute({
			query: input.query,
		});
		const savedProductsCount = await this.productCatalogRepository.save(
			liveResult.results,
		);

		this.logger.info(
			`[RefreshProductsCatalogUseCase] Background refresh completed for "${input.query}". Saved: ${savedProductsCount}. Warnings: ${liveResult.warnings.length}`,
		);
	}
}
