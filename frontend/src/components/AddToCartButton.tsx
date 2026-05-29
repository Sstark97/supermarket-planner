"use client";

import { Plus } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { IProduct } from "../types";

export function AddToCartButton({ product }: { product: IProduct }) {
	const addItem = useCartStore((state) => state.addItem);

	return (
		<button
			onClick={() => addItem(product)}
			className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 active:scale-95"
		>
			<Plus size={16} />
			<span className="text-xs font-medium px-1">Añadir</span>
		</button>
	);
}
