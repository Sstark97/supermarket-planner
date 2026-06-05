import type {
	GetShoppingSessionMetricsInput,
	GetShoppingSessionMetricsResult,
} from "@application/use-cases/shopping-session/contracts";

export interface GetShoppingSessionMetricsUseCasePort {
	execute(
		input: GetShoppingSessionMetricsInput,
	): Promise<GetShoppingSessionMetricsResult>;
}
