import { ProductSearchFilters } from "@/features/product-search/model/filters";
import { IProduct } from "@/types";

export interface ProductGateway {
	search(filters: ProductSearchFilters): Promise<IProduct[]>;
}
