import type {
	SearchProductsInput,
	SearchResult,
} from "../../use-cases/search/contracts";

export interface SearchProductsUseCasePort {
	execute(input: SearchProductsInput): Promise<SearchResult>;
}
