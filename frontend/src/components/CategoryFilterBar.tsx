"use client";

import { useCategoryUiStore } from "@/store/categoryUiStore";
import { CategoryFilter } from "./CategoryFilter";

export function CategoryFilterBar(): React.ReactElement {
	const { isVisible } = useCategoryUiStore();

	return (
		<div
			id="category-filter"
			className={`bg-white border-b border-slate-100 pt-4 pb-1 sticky top-16 z-30 ${!isVisible ? "md:hidden" : ""}`}
		>
			<div className="max-w-7xl mx-auto">
				<CategoryFilter />
			</div>
		</div>
	);
}
