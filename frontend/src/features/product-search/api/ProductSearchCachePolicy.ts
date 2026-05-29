import { ProductSearchFilters } from "../filters";

export class ProductSearchCachePolicy {
	for(
		filters: ProductSearchFilters,
	): { cache: "no-store" } | { next: { revalidate: number; tags: string[] } } {
		if (filters.query) {
			return { cache: "no-store" };
		}

		const tags = ["products"];
		if (filters.category) tags.push(`products:category:${filters.category}`);
		if (filters.supermarket)
			tags.push(`products:supermarket:${filters.supermarket}`);
		if (filters.sortBy) tags.push(`products:sort:${filters.sortBy}`);

		return {
			next: {
				revalidate: 60,
				tags,
			},
		};
	}
}
