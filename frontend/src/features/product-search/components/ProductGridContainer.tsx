"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductSearchFiltersMapper } from "@/features/product-search/model/filters";
import { useInfiniteProductSearch } from "@/features/product-search/hooks/useInfiniteProductSearch";
import { IProduct } from "@/types";
import { ProductGateway } from "@/lib/http/ProductGateway";
import { ClientContainerDI } from "@/lib/di/ClientContainerDI";
import { useLocationStore } from "@/store/locationStore";
import { ProductGrid, ProductGridSkeleton, ProductGridBatchSkeleton } from "./ProductGrid";
import { ScrollSentinel } from "./ScrollSentinel";
import { EndOfResultsFooter } from "./EndOfResultsFooter";

const filtersMapper = new ProductSearchFiltersMapper();

function flattenPages(
	pages: Array<{ results: IProduct[] }> | undefined,
): IProduct[] {
	if (!pages) return [];
	return pages.flatMap((page) => page.results);
}

function EmptyProductsState(): React.ReactElement {
	return (
		<div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 m-8">
			<span className="text-4xl mb-4">🛒</span>
			<h3 className="text-xl font-bold text-slate-800 mb-2">
				No encontramos productos
			</h3>
			<p className="text-slate-500 max-w-md">
				Prueba a buscar con otra palabra como &quot;leche&quot;, &quot;pan&quot;
				o asegúrate de que el backend tiene datos en la base.
			</p>
		</div>
	);
}

function ProductSearchError(): React.ReactElement {
	return (
		<div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-red-200 m-8">
			<span className="text-4xl mb-4">⚠️</span>
			<h3 className="text-xl font-bold text-slate-800 mb-2">
				No se pudieron cargar los productos
			</h3>
			<p className="text-slate-500 max-w-md">
				Hubo un error temporal con el servicio. Reintentá en unos segundos.
			</p>
		</div>
	);
}

function RefreshingIndicator(): React.ReactElement {
	return (
		<p className="text-center text-slate-400 text-xs py-2 animate-pulse">
			Actualizando precios...
		</p>
	);
}

export function ProductGridContainer(): React.ReactElement {
	const [gateway] = useState<ProductGateway>(() => new ClientContainerDI().resolveProductGateway());
	const searchParams = useSearchParams();
	const postalCode = useLocationStore((state) => state.postalCode);
	const filters = {
		...filtersMapper.parse(searchParams),
		...(postalCode ? { postalCode } : {}),
	};

	const {
		data,
		isPending,
		isError,
		isFetching,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	} = useInfiniteProductSearch(filters, gateway);

	const products = flattenPages(data?.pages);
	const hasLoadedProducts = products.length > 0;
	const isRefetchingCurrentPage = isFetching && !isFetchingNextPage && !isPending;

	if (isPending) {
		return <ProductGridSkeleton />;
	}

	if (isError) {
		return <ProductSearchError />;
	}

	if (!hasLoadedProducts) {
		return <EmptyProductsState />;
	}

	return (
		<>
			{isRefetchingCurrentPage && <RefreshingIndicator />}
			<ProductGrid products={products} />
			{isFetchingNextPage && <ProductGridBatchSkeleton />}
			<ScrollSentinel
				onIntersect={() => void fetchNextPage()}
				hasNextPage={hasNextPage}
			/>
			{!hasNextPage && <EndOfResultsFooter />}
		</>
	);
}
