import { Suspense } from "react";
import { CategoryFilterBar } from "@/features/product-search/components/CategoryFilterBar";
import { FilterMenu } from "@/features/product-search/components/FilterMenu";
import { ProductGridSkeleton } from "@/features/product-search/components/ProductGrid";
import { ProductGridContainer } from "@/features/product-search/components/ProductGridContainer";
import { ProductSearchFiltersMapper } from "@/features/product-search/model/filters";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const searchFiltersMapper = new ProductSearchFiltersMapper();
	const { query, category, supermarket, sortBy } = searchFiltersMapper.parse(
		await searchParams,
	);

	return (
		<div className="flex flex-col min-h-full">
			<CategoryFilterBar />

			<div className="flex-1 py-8">
				{/* Heading row — FilterMenu placed here on desktop, hidden on mobile */}
				<div className="max-w-7xl mx-auto px-4 mb-6 flex items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-slate-800">
							{query
								? `Resultados para "${query}"`
								: category
									? `Categoría: ${category}`
									: "Todos los productos"}
						</h1>
						<p className="text-slate-500 mt-1">
							Encontrando los mejores precios en Las Palmas...
						</p>
					</div>
					<FilterMenu
						key={`filters-${query}-${category}-${supermarket}-${sortBy}`}
					/>
				</div>

				<Suspense
					fallback={<ProductGridSkeleton />}
				>
					<ProductGridContainer />
				</Suspense>
			</div>
		</div>
	);
}
