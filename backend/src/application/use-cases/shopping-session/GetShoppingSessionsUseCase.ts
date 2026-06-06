import type { GetShoppingSessionsUseCasePort } from "@application/ports/incoming/GetShoppingSessionsUseCasePort";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type {
	GetShoppingSessionsInput,
	GetShoppingSessionsResult,
	ShoppingSessionHistoryItem,
} from "./contracts";
import type { ShoppingSessionItem } from "@domain/entities/ShoppingSession";

export class GetShoppingSessionsUseCase
	implements GetShoppingSessionsUseCasePort
{
	constructor(
		private readonly shoppingSessionRepository: ShoppingSessionRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(
		input: GetShoppingSessionsInput,
	): Promise<GetShoppingSessionsResult> {
		this.logger.info(
			`[GetShoppingSessionsUseCase] execute - userId: "${input.userId}"`,
		);

		const sessions = await this.shoppingSessionRepository.findByUserId(
			input.userId,
		);

		return {
			sessions: sessions.map((session) => ({
				sessionId: session.id,
				shoppedAt: session.shoppedAt.toISOString(),
				totalPrice: session.totalPrice,
				createdAt: session.createdAt.toISOString(),
				items: session.items.map((item) => this.mapSessionItemToOutput(item)),
			})),
		};
	}

	private mapSessionItemToOutput(item: ShoppingSessionItem): ShoppingSessionHistoryItem {
		return {
			productName: item.productName,
			supermarket: item.supermarket,
			category: item.category,
			price: item.price,
			pricePerUnit: item.pricePerUnit,
			unit: item.unit,
			taxType: item.taxType,
			quantity: item.quantity,
			image: item.image,
			url: item.url,
		};
	}
}
