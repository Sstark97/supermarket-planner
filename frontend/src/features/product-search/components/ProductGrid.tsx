import { ProductCard } from "./ProductCard";
import { ProductGateway } from "@/lib/http/ProductGateway";

export async function ProductGrid({
	productGateway,
	query,
	category,
	supermarket,
	sortBy,
}: {
	productGateway: ProductGateway;
	query?: string;
	category?: string;
	supermarket?: string;
	sortBy?: string;
}) {
	let products = [];
	try {
		products = await productGateway.search({
			query,
			category,
			supermarket,
			sortBy,
		});
	} catch (error) {
		console.error("[ProductGrid] Failed to load products", error);
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

	if (products.length === 0) {
		return (
			<div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 m-8">
				<span className="text-4xl mb-4">🛒</span>
				<h3 className="text-xl font-bold text-slate-800 mb-2">
					No encontramos productos
				</h3>
				<p className="text-slate-500 max-w-md">
					Prueba a buscar con otra palabra como &quot;leche&quot;,
					&quot;pan&quot; o asegúrate de que el backend tiene datos en la base.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 max-w-7xl mx-auto">
			{products.map((product) => (
				<ProductCard
					key={`${product.supermarket}-${product.id}`}
					product={product}
				/>
			))}
		</div>
	);
}

export function ProductGridSkeleton() {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 max-w-7xl mx-auto">
			{Array.from({ length: 10 }).map((_, i) => (
				<div
					key={i}
					className="animate-pulse bg-white p-4 rounded-2xl border border-slate-100 h-64 flex flex-col justify-between"
				>
					<div>
						<div className="flex justify-between mb-4">
							<div className="h-6 w-20 bg-slate-200 rounded-md"></div>
							<div className="h-4 w-16 bg-slate-100 rounded-md"></div>
						</div>
						<div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
						<div className="h-4 w-1/2 bg-slate-100 rounded"></div>
					</div>
					<div className="flex justify-between mt-auto items-end pt-4">
						<div>
							<div className="h-6 w-16 bg-slate-200 rounded mb-1"></div>
							<div className="h-3 w-24 bg-slate-100 rounded"></div>
						</div>
						<div className="h-8 w-16 bg-slate-800 rounded-xl"></div>
					</div>
				</div>
			))}
		</div>
	);
}
