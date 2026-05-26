import React, { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { CartButton } from "./CartButton";
import { ShoppingBasket } from "lucide-react";

export function Header() {
	return (
		<header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2 group shrink-0">
					<div className="bg-slate-900 p-2 rounded-xl group-hover:bg-slate-800 transition-colors">
						<ShoppingBasket size={20} className="text-white" />
					</div>
					<span className="font-bold text-lg hidden sm:block tracking-tight text-slate-900">
						Antigravity
						<span className="text-slate-400 font-medium">Market</span>
					</span>
				</Link>

				{/* Search Bar - Client Component */}
				<div className="flex-1 max-w-2xl mx-auto">
					<Suspense
						fallback={<div className="h-10 w-full rounded-full bg-slate-100" />}
					>
						<SearchBar />
					</Suspense>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 shrink-0">
					<CartButton />
				</div>
			</div>
		</header>
	);
}
