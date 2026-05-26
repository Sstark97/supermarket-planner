export interface FreshnessPolicy {
	isStale(scrapedAt: Date, now: Date): boolean;
}
