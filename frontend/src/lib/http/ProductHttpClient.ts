import {
	ProductSearchFilters,
	ProductSearchFiltersMapper,
} from "@/features/product-search/model/filters";
import { IProduct, PaginatedProductSearchResult } from "@/types";
import { ProductGateway } from "./ProductGateway";

const DEFAULT_PAGE_LIMIT = "20";

type ProductApiResponse = {
	results?: IProduct[];
	nextCursor?: string | null;
	totalCount?: number;
	error?: string;
	details?: string;
};

export class ProductHttpClient implements ProductGateway {
	private readonly filtersMapper = new ProductSearchFiltersMapper();

	constructor(private readonly baseUrl: string) {}

	async search(filters: ProductSearchFilters): Promise<IProduct[]> {
		const { results } = await this.searchPaginated(filters);
		return results;
	}

	async searchPaginated(
		filters: ProductSearchFilters,
	): Promise<PaginatedProductSearchResult> {
		const paginatedFilters = {
			...filters,
			limit: filters.limit ?? DEFAULT_PAGE_LIMIT,
		};
		const params = this.filtersMapper.toSearchParams(paginatedFilters);
		const queryString = params.toString();
		const url = `${this.baseUrl}/api/products${queryString ? `?${queryString}` : ""}`;

		const response = await fetch(url, { cache: "no-store" });
		const json = (await response.json()) as ProductApiResponse;

		if (!response.ok) {
			const detailsSuffix = json.details ? ` (${json.details})` : "";
			throw new Error(
				`Product API error ${response.status}: ${json.error ?? "Unknown error"}${detailsSuffix}`,
			);
		}

		return {
			results: Array.isArray(json?.results) ? json.results : [],
			nextCursor: json?.nextCursor ?? null,
			totalCount: typeof json?.totalCount === "number" ? json.totalCount : 0,
		};
	}
}
