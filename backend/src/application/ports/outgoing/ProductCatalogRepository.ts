import type { IProduct } from "@domain/entities/IProduct";

export interface ProductCatalogFilters {
	query?: string;
	category?: string;
	supermarket?: string;
	postalCode?: string;
	limit?: number;
}

export interface NormalizedNameCategoryUpdate {
	normalizedName: string;
	category: string;
}

export interface ProductCatalogRepository {
	find(filters: ProductCatalogFilters): Promise<IProduct[]>;
	save(products: IProduct[], postalCode: string): Promise<number>;
	findByCategory(category: string): Promise<IProduct[]>;
	updateCategoryByNormalizedNames(
		updates: NormalizedNameCategoryUpdate[],
	): Promise<number>;
}
