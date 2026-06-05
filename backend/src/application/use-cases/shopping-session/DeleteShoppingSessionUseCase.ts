import type { DeleteShoppingSessionUseCasePort } from "@application/ports/incoming/DeleteShoppingSessionUseCasePort";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type {
	DeleteShoppingSessionInput,
	DeleteShoppingSessionResult,
} from "./contracts";

export class DeleteShoppingSessionUseCase
	implements DeleteShoppingSessionUseCasePort
{
	constructor(
		private readonly shoppingSessionRepository: ShoppingSessionRepository,
		private readonly logger: LoggerPort,
	) {}

	async execute(
		input: DeleteShoppingSessionInput,
	): Promise<DeleteShoppingSessionResult> {
		if (input.sessionId.trim().length === 0) {
			throw new Error("sessionId is required.");
		}

		if (input.userId.trim().length === 0) {
			throw new Error("userId is required.");
		}

		this.logger.info(
			`[DeleteShoppingSessionUseCase] execute - userId: "${input.userId}", sessionId: "${input.sessionId}"`,
		);

		const deleted = await this.shoppingSessionRepository.deleteByIdForUser(
			input.sessionId,
			input.userId,
		);

		return { deleted };
	}
}
