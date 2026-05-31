import { v4 as uuidv4 } from "uuid";
import type { SaveShoppingSessionUseCasePort } from "@application/ports/incoming/SaveShoppingSessionUseCasePort";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type {
	SaveShoppingSessionInput,
	SaveShoppingSessionResult,
} from "./contracts";
import { ShoppingSessionTotalCalculator } from "@domain/services/ShoppingSessionTotalCalculator";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";

export class SaveShoppingSessionUseCase implements SaveShoppingSessionUseCasePort {
	constructor(
		private readonly shoppingSessionRepository: ShoppingSessionRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(input: SaveShoppingSessionInput): Promise<SaveShoppingSessionResult> {
		this.logger.info(
			`[SaveShoppingSessionUseCase] execute - userId: "${input.userId}", items: ${input.items.length}`,
		);

		if (input.items.length === 0) {
			throw new Error("Cannot save a shopping session with no items.");
		}

		const shoppedAt = new Date(input.shoppedAt);
		if (isNaN(shoppedAt.getTime())) {
			throw new Error(`Invalid shoppedAt date: "${input.shoppedAt}"`);
		}

		const totalPrice = ShoppingSessionTotalCalculator.calculate(input.items);
		const sessionId = uuidv4();

		const session: ShoppingSession = {
			id: sessionId,
			userId: input.userId,
			shoppedAt,
			totalPrice,
			createdAt: new Date(),
			items: input.items.map((item) => ({
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
			})),
		};

		const savedSession = await this.shoppingSessionRepository.save(session);

		this.logger.info(
			`[SaveShoppingSessionUseCase] session saved - id: "${savedSession.id}", total: ${savedSession.totalPrice}`,
		);

		return {
			sessionId: savedSession.id,
			totalPrice: savedSession.totalPrice,
			itemCount: savedSession.items.length,
		};
	}
}
