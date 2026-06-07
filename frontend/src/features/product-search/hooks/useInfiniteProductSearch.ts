"use client";

import {
	useInfiniteQuery,
	type UseInfiniteQueryResult,
	type InfiniteData,
} from "@tanstack/react-query";
import { ProductSearchFilters } from "@/features/product-search/model/filters";
import { PaginatedProductSearchResult } from "@/types";
import { ProductGateway } from "@/lib/http/ProductGateway";

function buildQueryKey(
	filters: ProductSearchFilters,
): readonly [
	"products",
	{
		query?: string;
		category?: string;
		supermarket?: string;
		sortBy?: string;
		limit?: string;
		postalCode?: string;
	},
] {
	const { query, category, supermarket, sortBy, limit, postalCode } = filters;
	return ["products", { query, category, supermarket, sortBy, limit, postalCode }] as const;
}

function fetchPage(
	filters: ProductSearchFilters,
	cursor: string | undefined,
	gateway: ProductGateway,
): Promise<PaginatedProductSearchResult> {
	return gateway.searchPaginated({ ...filters, cursor });
}

export function useInfiniteProductSearch(
	filters: ProductSearchFilters,
	gateway: ProductGateway,
): UseInfiniteQueryResult<InfiniteData<PaginatedProductSearchResult, string | undefined>, Error> {
	return useInfiniteQuery({
		queryKey: buildQueryKey(filters),
		queryFn: ({ pageParam }) => fetchPage(filters, pageParam, gateway),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}
