import { Suspense } from "react";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { FilterMenu } from "@/components/FilterMenu";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";
import { ProductSearchFiltersMapper } from "@/features/product-search/filters";
import { createServerContainer } from "@/lib/di/ContainerDI";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const searchFiltersMapper = new ProductSearchFiltersMapper();
	const { query, category, supermarket, sortBy } = searchFiltersMapper.parse(
		await searchParams,
	);

	const container = await createServerContainer();
	const productGateway = container.resolveProductGateway();

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
					key={`${query}-${category}-${supermarket}-${sortBy}`}
					fallback={<ProductGridSkeleton />}
				>
					<ProductGrid
						productGateway={productGateway}
						query={query}
						category={category}
						supermarket={supermarket}
						sortBy={sortBy}
					/>
				</Suspense>
			</div>
		</div>
	);
}
