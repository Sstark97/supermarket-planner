import type { MergeCartInput, MergeCartResult } from "@application/use-cases/active-cart/contracts";

export interface MergeCartUseCasePort {
	execute(input: MergeCartInput): Promise<MergeCartResult>;
}
