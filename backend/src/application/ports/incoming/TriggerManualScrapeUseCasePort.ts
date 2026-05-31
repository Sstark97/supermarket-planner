import type {
	SearchResult,
	TriggerManualScrapeInput,
} from "@application/use-cases/search/contracts";

export interface TriggerManualScrapeUseCasePort {
	execute(input: TriggerManualScrapeInput): Promise<SearchResult>;
}
