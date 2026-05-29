export type ProductSearchFilters = {
	query?: string;
	category?: string;
	supermarket?: string;
	sortBy?: string;
};

type SearchParamsObject = { [key: string]: string | string[] | undefined };
export type ProductSearchFilterSource = URLSearchParams | SearchParamsObject;

export class ProductSearchFiltersMapper {
	parse(source: ProductSearchFilterSource): ProductSearchFilters {
		return {
			query: this.getValue(source, "q"),
			category: this.getValue(source, "category"),
			supermarket: this.getValue(source, "supermarket"),
			sortBy: this.getValue(source, "sortBy"),
		};
	}

	toSearchParams(filters: ProductSearchFilters): URLSearchParams {
		const params = new URLSearchParams();

		if (filters.query) params.set("q", filters.query);
		if (filters.category) params.set("category", filters.category);
		if (filters.supermarket) params.set("supermarket", filters.supermarket);
		if (filters.sortBy) params.set("sortBy", filters.sortBy);

		return params;
	}

	private getValue(
		source: ProductSearchFilterSource,
		key: string,
	): string | undefined {
		if (source instanceof URLSearchParams) {
			return this.normalizeValue(source.get(key));
		}

		return this.normalizeValue(source[key]);
	}

	private normalizeValue(
		value: string | string[] | null | undefined,
	): string | undefined {
		if (typeof value !== "string") {
			return undefined;
		}

		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}
}
