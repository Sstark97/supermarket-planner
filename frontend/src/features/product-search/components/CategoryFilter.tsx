"use client";

import { useRouter } from "next/navigation";
import { ProductCategory } from "@/types";
import { useQueryParams } from "@/hooks/useQueryParams";

const CATEGORIES = Object.values(ProductCategory);

// Translates enum values to display strings, or adds custom ones prioritizing UX
const categoryLabels: Record<string, string> = {
	dairy: "Lácteos",
	meat: "Carnes",
	fish: "Pescados",
	fruits_veg: "Frutas y Verduras",
	bakery: "Panadería",
	drinks: "Bebidas",
	frozen: "Congelados",
	cleaning: "Limpieza",
	personal_care: "Higiene",
	snacks: "Snacks y Dulces",
	canned_goods: "Conservas",
	condiments: "Salsas y Especias",
	cereals_pasta: "Cereales",
	baby: "Bebé",
	pet: "Mascotas",
	other: "Otros",
};

export function CategoryFilter() {
	const router = useRouter();
	const { searchParams, buildMergedHref } = useQueryParams();

	const currentCategory = searchParams.get("category") || null;

	const handleCategoryClick = (category: string | null) => {
		router.push(buildMergedHref({ category }));
	};

	return (
		<div
			className="px-4 pb-3 overflow-x-auto md:overflow-x-visible [&::-webkit-scrollbar]:hidden"
			style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
		>
			<div className="flex flex-nowrap md:flex-wrap gap-2">
				<button
					onClick={() => handleCategoryClick(null)}
					className={`whitespace-nowrap px-4 py-2.5 md:py-1.5 rounded-full text-sm font-medium transition-colors ${!currentCategory ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
				>
					Todos
				</button>
				{CATEGORIES.map((cat) => (
					<button
						key={cat}
						onClick={() => handleCategoryClick(cat)}
						className={`whitespace-nowrap px-4 py-2.5 md:py-1.5 rounded-full text-sm font-medium transition-colors ${currentCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
					>
						{categoryLabels[cat] || cat}
					</button>
				))}
			</div>
		</div>
	);
}
