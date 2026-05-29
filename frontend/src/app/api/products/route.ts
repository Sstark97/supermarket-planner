import { ProductSearchApiResponseMapper } from "@/features/product-search/api/ProductSearchApiResponseMapper";
import { ProductSearchApiUrlPolicy } from "@/features/product-search/api/ProductSearchApiUrlPolicy";
import { ProductSearchCachePolicy } from "@/features/product-search/api/ProductSearchCachePolicy";
import { ProductSearchRequestBuilder } from "@/features/product-search/api/ProductSearchRequestBuilder";
import { ProductSearchFiltersMapper } from "@/features/product-search/filters";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const mapper = new ProductSearchFiltersMapper();
	const responseMapper = new ProductSearchApiResponseMapper();
	const cachePolicy = new ProductSearchCachePolicy();
	const apiUrlPolicy = new ProductSearchApiUrlPolicy();
	const requestBuilder = new ProductSearchRequestBuilder(
		apiUrlPolicy.resolveApiUrl(),
	);
	const filters = mapper.parse(request.nextUrl.searchParams);
	const params = mapper.toSearchParams(filters);
	const requestUrl = requestBuilder.buildUrl(params);
	const allowedOrigins = new Set([
		"http://localhost:3000",
		"http://backend:3000",
	]);
	if (!allowedOrigins.has(requestUrl.origin)) {
		throw new Error(`Blocked outbound origin: ${requestUrl.origin}`);
	}

	try {
		const res = await fetch(requestUrl, cachePolicy.for(filters));

		if (!res.ok) {
			const body = await res.text();
			if (res.status === 400 && !filters.query) {
				return responseMapper.toSuccess({ results: [] });
			}

			return responseMapper.toBackendFailure(res.status, body);
		}

		const payload = await res.json();
		return responseMapper.toSuccess(payload);
	} catch (error) {
		return responseMapper.toUnavailable(error);
	}
}
