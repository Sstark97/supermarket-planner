import type { IProduct } from "../../../interfaces/IProduct";

export interface ProductCatalogFilters {
	query?: string;
	category?: string;
	supermarket?: string;
	limit?: number;
}

export interface ProductCatalogRepository {
	find(filters: ProductCatalogFilters): Promise<IProduct[]>;
	save(products: IProduct[]): Promise<number>;
}
