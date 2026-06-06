export interface CategoryCacheEntry {
	normalizedName: string;
	category: string;
}

export interface CategoryCacheRepository {
	findByNormalizedName(normalizedName: string): Promise<string | undefined>;
	findByNormalizedNames(normalizedNames: string[]): Promise<Map<string, string>>;
	upsertMany(entries: CategoryCacheEntry[]): Promise<void>;
}
