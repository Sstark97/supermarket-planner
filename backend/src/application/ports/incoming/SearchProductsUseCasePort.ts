import type {
	SearchProductsInput,
	SearchResult,
} from "@application/use-cases/search/contracts";

export interface SearchProductsUseCasePort {
	execute(input: SearchProductsInput): Promise<SearchResult>;
}
