"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useCartUiStore } from "../store/cartUiStore";

export function CartButton() {
	const totalItems = useCartStore((state) => state.totalItems);
	const openCart = useCartUiStore((state) => state.open);

	return (
		<button
			onClick={openCart}
			className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
		>
			<ShoppingCart size={24} className="text-slate-700" />
			{totalItems > 0 && (
				<span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
					{totalItems}
				</span>
			)}
		</button>
	);
}
