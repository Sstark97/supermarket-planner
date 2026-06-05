import type { GetShoppingSessionMetricsUseCasePort } from "@application/ports/incoming/GetShoppingSessionMetricsUseCasePort";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type {
	GetShoppingSessionMetricsInput,
	GetShoppingSessionMetricsResult,
} from "./contracts";

export class GetShoppingSessionMetricsUseCase
	implements GetShoppingSessionMetricsUseCasePort
{
	constructor(
		private readonly shoppingSessionRepository: ShoppingSessionRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(
		input: GetShoppingSessionMetricsInput,
	): Promise<GetShoppingSessionMetricsResult> {
		this.logger.info(
			`[GetShoppingSessionMetricsUseCase] execute - userId: "${input.userId}"`,
		);

		if (input.userId.trim().length === 0) {
			throw new Error("User id is required to load shopping session metrics.");
		}

		const metrics = await this.shoppingSessionRepository.getMetricsForUser(
			input.userId,
		);

		return {
			supermarketDominance: metrics.supermarketDominance,
			spendingTrends: metrics.spendingTrends,
			ticketMetrics: metrics.ticketMetrics,
		};
	}
}
