import type {
	SaveShoppingSessionInput,
	SaveShoppingSessionResult,
} from "@application/use-cases/shopping-session/contracts";

export interface SaveShoppingSessionUseCasePort {
	execute(input: SaveShoppingSessionInput): Promise<SaveShoppingSessionResult>;
}
