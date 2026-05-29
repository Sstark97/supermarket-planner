import {
	ProductSearchFilters,
	ProductSearchFiltersMapper,
} from "@/features/product-search/filters";
import { IProduct } from "@/types";
import { ProductGateway } from "./ProductGateway";

type ProductApiResponse = {
	results?: IProduct[];
	error?: string;
};

export class ProductHttpClient implements ProductGateway {
	constructor(private readonly baseUrl: string) {}

	async search(filters: ProductSearchFilters): Promise<IProduct[]> {
		const searchFiltersMapper = new ProductSearchFiltersMapper();
		const params = searchFiltersMapper.toSearchParams(filters);
		const queryString = params.toString();
		const url = `${this.baseUrl}/api/products${queryString ? `?${queryString}` : ""}`;

		try {
			const res = await fetch(url, {
				cache: "no-store",
			});

			if (!res.ok) {
				throw new Error(`API Error: ${res.status}`);
			}

			const json = (await res.json()) as ProductApiResponse;
			return Array.isArray(json?.results) ? json.results : [];
		} catch (error) {
			console.error("[ProductHttpClient] search failed", error);
			return [];
		}
	}
}
