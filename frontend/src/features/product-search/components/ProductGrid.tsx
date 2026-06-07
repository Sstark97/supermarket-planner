import { IProduct } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
	products: IProduct[];
}

export function ProductGrid({ products }: ProductGridProps): React.ReactElement {
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

function SkeletonCard(): React.ReactElement {
	return (
		<div className="animate-pulse bg-white p-4 rounded-2xl border border-slate-100 h-64 flex flex-col justify-between">
			<div>
				<div className="flex justify-between mb-4">
					<div className="h-6 w-20 bg-linear-to-r from-kilox-slate/30 to-kilox-cyan/10 rounded-md"></div>
					<div className="h-4 w-16 bg-kilox-slate/20 rounded-md"></div>
				</div>
				<div className="h-4 w-3/4 bg-linear-to-r from-kilox-slate/30 to-kilox-cyan/10 rounded mb-2"></div>
				<div className="h-4 w-1/2 bg-kilox-slate/20 rounded"></div>
			</div>
			<div className="flex justify-between mt-auto items-end pt-4">
				<div>
					<div className="h-6 w-16 bg-linear-to-r from-kilox-slate/30 to-kilox-cyan/10 rounded mb-1"></div>
					<div className="h-3 w-24 bg-kilox-slate/20 rounded"></div>
				</div>
				<div className="h-8 w-16 bg-kilox-gradient rounded-xl"></div>
			</div>
		</div>
	);
}

const INITIAL_SKELETON_CARD_COUNT = 10;
const BATCH_SKELETON_CARD_COUNT = 4;

export function ProductGridSkeleton(): React.ReactElement {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 max-w-7xl mx-auto">
			{Array.from({ length: INITIAL_SKELETON_CARD_COUNT }).map(
				(_, cardIndex) => (
					<SkeletonCard key={cardIndex} />
				),
			)}
		</div>
	);
}

export function ProductGridBatchSkeleton(): React.ReactElement {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 max-w-7xl mx-auto">
			{Array.from({ length: BATCH_SKELETON_CARD_COUNT }).map((_, cardIndex) => (
				<SkeletonCard key={cardIndex} />
			))}
		</div>
	);
}
