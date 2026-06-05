"use client";

import { usePathname } from "next/navigation";
import { CategoriesToggleButton } from "./CategoriesToggleButton";

export function ProductPageCategoriesToggleButton(): React.ReactElement | null {
	const pathname = usePathname();

	if (pathname !== "/") {
		return null;
	}

	return <CategoriesToggleButton />;
}
