import type { ProductCategory } from "../../../domain/entities/IProduct";

export interface AiCategorizer {
	categorize(productName: string): Promise<ProductCategory | undefined>;
}
