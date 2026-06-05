"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	History,
	House,
	LayoutGrid,
	Search,
	SlidersHorizontal,
	ShoppingCart,
} from "lucide-react";
import { useCartUiStore } from "@/store/cartUiStore";
import { useFilterUiStore } from "@/store/filterUiStore";
import { useCategoryUiStore } from "@/store/categoryUiStore";

export function MobileBottomNav(): React.ReactElement {
	const pathname = usePathname();
	const openCart = useCartUiStore((state) => state.open);
	const openFilter = useFilterUiStore((state) => state.openFilter);
	const { isVisible, toggleCategories } = useCategoryUiStore();

	const isHome = pathname === "/";
	const isHistory = pathname === "/shopping-history";

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-slate-100 pb-[env(safe-area-inset-bottom)]"
			aria-label="Navegación principal"
		>
			<div className="flex">
				<Link
					href="/"
					aria-label="Inicio"
					className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs transition-colors ${
						isHome ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
					}`}
				>
					<House size={20} />
					<span>Inicio</span>
				</Link>

				<Link
					href="/shopping-history"
					aria-label="Historial"
					className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs transition-colors ${
						isHistory ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
					}`}
				>
					<History size={20} />
					<span>Historial</span>
				</Link>

				{isHome ? (
					<button
						onClick={toggleCategories}
						aria-label="Categorías"
						className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs transition-colors ${
							isVisible
								? "text-blue-600"
								: "text-slate-500 hover:text-slate-700"
						}`}
					>
						<LayoutGrid size={20} />
						<span>Categorías</span>
					</button>
				) : (
					<Link
						href="/?focus=search"
						aria-label="Buscar"
						className="flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs text-slate-500 hover:text-slate-700 transition-colors"
					>
						<Search size={20} />
						<span>Buscar</span>
					</Link>
				)}

				{isHome && (
					<button
						onClick={openFilter}
						aria-label="Filtros"
						className="flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs text-slate-500 hover:text-slate-700 transition-colors"
					>
						<SlidersHorizontal size={20} />
						<span>Filtros</span>
					</button>
				)}

				<button
					onClick={openCart}
					aria-label="Carrito"
					className="flex flex-col items-center justify-center gap-0.5 flex-1 h-16 text-xs text-slate-500 hover:text-slate-700 transition-colors"
				>
					<ShoppingCart size={20} />
					<span>Carrito</span>
				</button>
			</div>
		</nav>
	);
}
