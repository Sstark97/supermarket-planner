import type {
	DeleteShoppingSessionInput,
	DeleteShoppingSessionResult,
} from "@application/use-cases/shopping-session/contracts";

export interface DeleteShoppingSessionUseCasePort {
	execute(
		input: DeleteShoppingSessionInput,
	): Promise<DeleteShoppingSessionResult>;
}
