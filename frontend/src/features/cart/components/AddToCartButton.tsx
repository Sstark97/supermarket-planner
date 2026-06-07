"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/Button";
import { IProduct } from "@/types";

export function AddToCartButton({
	product,
}: {
	product: IProduct;
}): React.ReactElement {
	const addItem = useCartStore((state) => state.addItem);

	return (
		<Button
			variant="kilox"
			onClick={() => addItem(product)}
			className="p-2 active:scale-95 min-w-11 min-h-11"
		>
			<Plus size={16} />
			<span className="text-xs font-medium px-1">Añadir</span>
		</Button>
	);
}
