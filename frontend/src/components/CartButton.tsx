"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";

export function CartButton() {
	const totalItems = useCartStore((state) => state.totalItems);
	const openCart = useCartUiStore((state) => state.open);
	const { isMounted } = useHydrationGuard();

	const hasBadge = isMounted && totalItems > 0;

	return (
		<button
			onClick={openCart}
			className="relative p-2 rounded-full hover:bg-slate-100 transition-colors min-w-11 min-h-11 flex items-center justify-center"
		>
			<ShoppingCart size={24} className="text-slate-700" />
			{hasBadge && (
				<span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
					{totalItems}
				</span>
			)}
		</button>
	);
}
