import type {
	SearchResult,
	TriggerManualScrapeInput,
} from "../../use-cases/search/contracts";

export interface TriggerManualScrapeUseCasePort {
	execute(input: TriggerManualScrapeInput): Promise<SearchResult>;
}
