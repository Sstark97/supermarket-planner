import {
	ProductSearchFilters,
	ProductSearchFiltersMapper,
} from "@/features/product-search/filters";
import { IProduct } from "@/types";
import { ProductGateway } from "./ProductGateway";

type ProductApiResponse = {
	results?: IProduct[];
	error?: string;
	details?: string;
};

export class ProductHttpClient implements ProductGateway {
	constructor(private readonly baseUrl: string) {}

	async search(filters: ProductSearchFilters): Promise<IProduct[]> {
		const searchFiltersMapper = new ProductSearchFiltersMapper();
		const params = searchFiltersMapper.toSearchParams(filters);
		const queryString = params.toString();
		const url = `${this.baseUrl}/api/products${queryString ? `?${queryString}` : ""}`;

		const res = await fetch(url, {
			cache: "no-store",
		});

		const json = (await res.json()) as ProductApiResponse;
		if (!res.ok) {
			const detailsSuffix = json.details ? ` (${json.details})` : "";
			throw new Error(
				`Product API error ${res.status}: ${json.error || "Unknown error"}${detailsSuffix}`,
			);
		}

		return Array.isArray(json?.results) ? json.results : [];
	}
}
