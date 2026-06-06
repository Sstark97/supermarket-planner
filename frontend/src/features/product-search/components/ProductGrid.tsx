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
