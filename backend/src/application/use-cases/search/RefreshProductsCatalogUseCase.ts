import type { TriggerManualScrapeUseCasePort } from "@application/ports/incoming/TriggerManualScrapeUseCasePort";
import type { ProductCatalogRepository } from "@application/ports/outgoing/ProductCatalogRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { RefreshProductsCatalogInput } from "./contracts";

export class RefreshProductsCatalogUseCase {
	constructor(
		private readonly triggerManualScrapeHandler: TriggerManualScrapeUseCasePort,
		private readonly productCatalogRepository: ProductCatalogRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(input: RefreshProductsCatalogInput): Promise<void> {
		this.logger.info(
			`[RefreshProductsCatalogUseCase] Background refresh started for query: "${input.query}", postalCode: "${input.postalCode}"`,
		);
		const liveResult = await this.triggerManualScrapeHandler.execute({
			query: input.query,
			postalCode: input.postalCode,
		});
		const savedProductsCount = await this.productCatalogRepository.save(
			liveResult.results,
			input.postalCode,
		);

		this.logger.info(
			`[RefreshProductsCatalogUseCase] Background refresh completed for "${input.query}". Saved: ${savedProductsCount}. Warnings: ${liveResult.warnings.length}`,
		);
	}
}
