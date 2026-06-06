import type {
	CategoryCacheEntry,
	CategoryCacheRepository,
} from "@application/ports/outgoing/CategoryCacheRepository";
import { prisma } from "./prisma";

export class PrismaCategoryCacheRepository implements CategoryCacheRepository {
	async findByNormalizedName(
		normalizedName: string,
	): Promise<string | undefined> {
		const entry = await prisma.productCategoryCache.findUnique({
			where: { normalizedName },
			select: { category: true },
		});
		return entry?.category ?? undefined;
	}

	async findByNormalizedNames(
		normalizedNames: string[],
	): Promise<Map<string, string>> {
		if (normalizedNames.length === 0) {
			return new Map();
		}

		const entries = await prisma.productCategoryCache.findMany({
			where: { normalizedName: { in: normalizedNames } },
			select: { normalizedName: true, category: true },
		});

		const result = new Map<string, string>();
		for (const entry of entries) {
			result.set(entry.normalizedName, entry.category);
		}
		return result;
	}

	async upsertMany(entries: CategoryCacheEntry[]): Promise<void> {
		if (entries.length === 0) {
			return;
		}

		await Promise.all(
			entries.map((entry) =>
				prisma.productCategoryCache.upsert({
					where: { normalizedName: entry.normalizedName },
					update: { category: entry.category },
					create: {
						normalizedName: entry.normalizedName,
						category: entry.category,
					},
				}),
			),
		);
	}
}
