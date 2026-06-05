"use client";

import { LayoutGrid } from "lucide-react";
import { useCategoryUiStore } from "@/store/categoryUiStore";

export function CategoriesToggleButton(): React.ReactElement {
	const { isVisible, toggleCategories } = useCategoryUiStore();

	return (
		<button
			onClick={toggleCategories}
			className={`flex items-center gap-1.5 px-4 min-h-11 border rounded-full text-sm font-medium transition-all ${
				isVisible
					? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
					: "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-900"
			}`}
		>
			<LayoutGrid size={15} />
			Categorías
		</button>
	);
}
