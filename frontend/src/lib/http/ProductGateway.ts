import { ProductSearchFilters } from "@/features/product-search/model/filters";
import { IProduct, PaginatedProductSearchResult } from "@/types";

export interface ProductGateway {
	search(filters: ProductSearchFilters): Promise<IProduct[]>;
	searchPaginated(
		filters: ProductSearchFilters,
	): Promise<PaginatedProductSearchResult>;
}
