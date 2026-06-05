"use client";

import { useState } from "react";
import Link from "next/link";
import {
	ShoppingCart,
	X,
	Plus,
	Minus,
	Trash2,
	Save,
	History,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";
import { SupermarketBadge } from "./SupermarketBadge";
import { SaveShoppingModal } from "./SaveShoppingModal";
import { useToast } from "./Toast";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import { ClientContainerDI } from "@/lib/di/ClientContainerDI";
import { CartItemMapper } from "@/features/shopping-history/CartItemMapper";

const shoppingSessionGateway =
	new ClientContainerDI().resolveShoppingSessionGateway();

export function CartSidebar(): React.ReactElement | null {
	const items = useCartStore((state) => state.items);
	const cartTotal = useCartStore((state) => state.totalPrice);
	const updateQuantity = useCartStore((state) => state.updateQuantity);
	const clearCart = useCartStore((state) => state.clearCart);
	const isOpen = useCartUiStore((state) => state.isOpen);
	const closeCart = useCartUiStore((state) => state.close);

	const { data: session } = useSession();
	const { showToast } = useToast();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isSavedConfirmationVisible, setIsSavedConfirmationVisible] =
		useState(false);

	function handleCloseCart(): void {
		setIsSavedConfirmationVisible(false);
		closeCart();
	}

	if (!isOpen) return null;

	function handleSaveButtonClick(): void {
		if (session?.user) {
			setIsSavedConfirmationVisible(false);
			setIsModalOpen(true);
		} else {
			void signIn("google");
		}
	}

	async function handleSaveConfirm(shoppedAt: string): Promise<void> {
		setIsSaving(true);
		try {
			const token = await getAuthToken();
			const sessionItems = CartItemMapper.toSessionItems(items);
			await shoppingSessionGateway.save(
				{ shoppedAt, items: sessionItems },
				token,
			);
			showToast("Compra guardada correctamente", "success");
			clearCart();
			setIsModalOpen(false);
			setIsSavedConfirmationVisible(true);
		} catch {
			showToast("Error al guardar la compra", "error");
		} finally {
			setIsSaving(false);
		}
	}

	const hasSaveButton = items.length > 0;
	const saveButtonLabel = session?.user
		? "Guardar compra"
		: "Inicia sesión para guardar";

	return (
		<>
			<div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
				{/* Dark backdrop */}
				<div
					className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
					onClick={handleCloseCart}
				/>

				{/* Cart panel — slides up from bottom on mobile, in from right on desktop */}
				<div className="relative w-full md:max-w-md bg-white md:h-full shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300 rounded-t-2xl md:rounded-none max-h-[90vh] md:max-h-full">
					<div className="flex items-center justify-between p-5 border-b border-slate-100">
						<h2 className="text-lg font-bold flex items-center gap-2">
							<ShoppingCart size={20} />
							Tu Compra
						</h2>
						<button
							onClick={handleCloseCart}
							className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors min-w-11 min-h-11 flex items-center justify-center"
						>
							<X size={20} />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-5">
						{isSavedConfirmationVisible ? (
							<div className="flex flex-col items-center justify-center h-full text-center px-4">
								<div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mb-4">
									<History size={22} />
								</div>
								<h3 className="text-lg font-semibold text-slate-900 mb-2">
									Compra guardada
								</h3>
								<p className="text-slate-600 mb-5">
									Ya podés revisar el detalle en tu historial.
								</p>
								<div className="w-full max-w-xs space-y-2">
									<Link
										href="/shopping-history"
										onClick={handleCloseCart}
										className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
									>
										<History size={16} />
										Ver historial
									</Link>
									<button
										onClick={handleCloseCart}
										className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
									>
										Seguir comprando
									</button>
								</div>
							</div>
						) : items.length === 0 ? (
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
												className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-lg transition-colors min-w-11 min-h-11 flex items-center justify-center"
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
												className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-lg transition-colors min-w-11 min-h-11 flex items-center justify-center"
											>
												<Plus size={14} />
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Total summary and save action */}
					{items.length > 0 && (
						<div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col gap-3">
							<div className="flex justify-between items-center">
								<span className="text-slate-500 font-medium">
									Total de la lista
								</span>
								<span className="text-2xl font-bold text-slate-900">
									{cartTotal.toFixed(2)}€
								</span>
							</div>
							{hasSaveButton && (
								<button
									onClick={handleSaveButtonClick}
									disabled={isSaving}
									className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
								>
									<Save size={16} />
									{saveButtonLabel}
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			<SaveShoppingModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onConfirm={(date) => void handleSaveConfirm(date)}
				isLoading={isSaving}
			/>
		</>
	);
}
