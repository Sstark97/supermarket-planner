import type { ProductCategory } from "../../../interfaces/IProduct";

export interface KeywordCategorizer {
	match(productName: string): ProductCategory | undefined;
}
