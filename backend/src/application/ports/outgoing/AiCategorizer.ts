import type { ProductCategory } from "../../../interfaces/IProduct";

export interface AiCategorizer {
	categorize(productName: string): Promise<ProductCategory | undefined>;
}
