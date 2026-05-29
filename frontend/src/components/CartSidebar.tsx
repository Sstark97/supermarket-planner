"use client";

import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useCartUiStore } from "../store/cartUiStore";
import { SupermarketBadge } from "./SupermarketBadge";

export function CartSidebar() {
	const items = useCartStore((state) => state.items);
	const cartTotal = useCartStore((state) => state.totalPrice);
	const updateQuantity = useCartStore((state) => state.updateQuantity);
	const isOpen = useCartUiStore((state) => state.isOpen);
	const closeCart = useCartUiStore((state) => state.close);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			{/* Fondo oscuro */}
			<div
				className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
				onClick={closeCart}
			/>

			{/* Panel lateral del carrito */}
			<div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
				<div className="flex items-center justify-between p-5 border-b border-slate-100">
					<h2 className="text-lg font-bold flex items-center gap-2">
						<ShoppingCart size={20} />
						Tu Compra
					</h2>
					<button
						onClick={closeCart}
						className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-5">
					{items.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-slate-400">
							<ShoppingCart size={48} className="mb-4 opacity-20" />
							<p>Tu carrito está vacío</p>
						</div>
					) : (
						<ul className="space-y-4">
							{items.map((item) => (
								<li
									key={item.itemKey}
									className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
								>
									<div className="flex-1 min-w-0">
										<h4 className="text-sm font-medium text-slate-800 truncate">
											{item.product.name}
										</h4>
										<div className="flex items-center gap-2 mt-1">
											<SupermarketBadge
												supermarket={item.product.supermarket}
											/>
											<span className="text-sm font-semibold text-slate-600">
												{item.product.price.toFixed(2)}€
											</span>
										</div>
									</div>

									<div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
										<button
											onClick={() => updateQuantity(item.itemKey, -1)}
											className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-lg transition-colors"
										>
											{item.quantity === 1 ? (
												<Trash2 size={14} className="text-red-400" />
											) : (
												<Minus size={14} />
											)}
										</button>
										<span className="w-8 text-center text-sm font-medium">
											{item.quantity}
										</span>
										<button
											onClick={() => updateQuantity(item.itemKey, 1)}
											className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-lg transition-colors"
										>
											<Plus size={14} />
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Resumen del Total */}
				{items.length > 0 && (
					<div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
						<div className="flex justify-between items-center">
							<span className="text-slate-500 font-medium">
								Total de la lista
							</span>
							<span className="text-2xl font-bold text-slate-900">
								{cartTotal.toFixed(2)}€
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
