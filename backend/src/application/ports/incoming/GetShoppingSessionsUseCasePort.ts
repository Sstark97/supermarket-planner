import type {
	GetShoppingSessionsInput,
	GetShoppingSessionsResult,
} from "@application/use-cases/shopping-session/contracts";

export interface GetShoppingSessionsUseCasePort {
	execute(input: GetShoppingSessionsInput): Promise<GetShoppingSessionsResult>;
}
