import { ProductSearchFilters } from "@/features/product-search/filters";
import { IProduct } from "@/types";

export interface ProductGateway {
	search(filters: ProductSearchFilters): Promise<IProduct[]>;
}
