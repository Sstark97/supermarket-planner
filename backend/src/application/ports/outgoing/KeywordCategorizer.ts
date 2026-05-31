import type { ProductCategory } from "@domain/entities/IProduct";

export interface KeywordCategorizer {
	match(productName: string): ProductCategory | undefined;
}
