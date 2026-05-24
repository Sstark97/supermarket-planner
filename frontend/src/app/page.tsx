import React, { Suspense } from 'react';
import { CategoryFilter } from '@/components/CategoryFilter';
import { FilterMenu } from '@/components/FilterMenu';
import { ProductGrid, ProductGridSkeleton } from '@/components/ProductGrid';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const unresolvedSearchParams = await searchParams;
  
  const query = typeof unresolvedSearchParams.q === 'string' ? unresolvedSearchParams.q : undefined;
  const category = typeof unresolvedSearchParams.category === 'string' ? unresolvedSearchParams.category : undefined;
  const supermarket = typeof unresolvedSearchParams.supermarket === 'string' ? unresolvedSearchParams.supermarket : undefined;
  const sortBy = typeof unresolvedSearchParams.sortBy === 'string' ? unresolvedSearchParams.sortBy : undefined;

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-slate-100 pt-6 pb-2 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CategoryFilter />
          <div className="flex justify-end pb-2 md:pb-0">
            <FilterMenu />
          </div>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {query ? `Resultados para "${query}"` : category ? `Categoría: ${category}` : 'Todos los productos'}
          </h1>
          <p className="text-slate-500 mt-1">Encontrando los mejores precios en Las Palmas...</p>
        </div>

        <Suspense key={`${query}-${category}-${supermarket}-${sortBy}`} fallback={<ProductGridSkeleton />}>
          <ProductGrid query={query} category={category} supermarket={supermarket} sortBy={sortBy} />
        </Suspense>
      </div>
    </div>
  );
}
