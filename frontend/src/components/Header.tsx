import React, { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/features/product-search/components/SearchBar";
import { CartButton } from "@/features/cart/components/CartButton";
import { ProductPageCategoriesToggleButton } from "@/features/product-search/components/ProductPageCategoriesToggleButton";
import { LoginButton } from "./LoginButton";
import { History, ShoppingBasket } from "lucide-react";

export function Header(): React.ReactElement {
	return (
		<header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2 group shrink-0">
					<div className="bg-slate-900 p-2 rounded-xl group-hover:bg-slate-800 transition-colors">
						<ShoppingBasket size={20} className="text-white" />
					</div>
					<span className="font-bold text-lg hidden sm:block tracking-tight text-slate-900">
						Kilox
						<span className="text-slate-400 font-medium">Market</span>
					</span>
				</Link>

				{/* Search Bar — full width on mobile, constrained on desktop */}
				<div className="flex-1 w-full max-w-2xl mx-auto">
					<Suspense
						fallback={<div className="h-10 w-full rounded-full bg-slate-100" />}
					>
						<SearchBar />
					</Suspense>
				</div>

				{/* Desktop actions: categories toggle + cart + login */}
				<div className="hidden md:flex items-center gap-2 shrink-0">
					<Link
						href="/shopping-history"
						className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
					>
						<History size={16} />
						Historial
					</Link>
					<ProductPageCategoriesToggleButton />
					<CartButton />
					<LoginButton />
				</div>
			</div>
		</header>
	);
}
