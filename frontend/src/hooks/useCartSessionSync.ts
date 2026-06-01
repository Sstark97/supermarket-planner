"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore, type CartItem } from "@/store/cartStore";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import { ClientContainerDI } from "@/lib/di/ClientContainerDI";
import type { CartMergeItem, CartMergeResponse } from "@/lib/http/CartMergeGateway";
import { ProductCategory, type IProduct } from "@/types";

const container = new ClientContainerDI();
const cartMergeGateway = container.resolveCartMergeGateway();

const VALID_CATEGORIES = new Set<string>(Object.values(ProductCategory));

function parseCategory(value: string): ProductCategory {
	return VALID_CATEGORIES.has(value) ? (value as ProductCategory) : ProductCategory.OTHER;
}

function parseTaxType(value: string): IProduct["taxType"] {
	if (value === "IGIC" || value === "IVA" || value === "UNKNOWN") return value;
	return "UNKNOWN";
}

function toMergeItem(cartItem: CartItem): CartMergeItem {
	const { product, quantity } = cartItem;
	return {
		productId: product.id,
		productName: product.name,
		supermarket: product.supermarket,
		category: product.category,
		price: product.price,
		pricePerUnit: product.pricePerUnit,
		unit: product.unit,
		taxType: product.taxType,
		quantity,
		image: product.image,
		url: product.url,
	};
}

function toCartItem(mergeItem: CartMergeItem): CartItem {
	const product: IProduct = {
		id: mergeItem.productId,
		name: mergeItem.productName,
		supermarket: mergeItem.supermarket,
		category: parseCategory(mergeItem.category),
		price: mergeItem.price,
		pricePerUnit: mergeItem.pricePerUnit,
		unit: mergeItem.unit,
		taxType: parseTaxType(mergeItem.taxType),
		scrapedAt: new Date().toISOString(),
		image: mergeItem.image,
		url: mergeItem.url,
	};
	const itemKey = `${product.supermarket}:${product.id}`;
	return { itemKey, product, quantity: mergeItem.quantity };
}

function toCartItems(response: CartMergeResponse): CartItem[] {
	return response.items.map(toCartItem);
}

async function mergeLocalCartWithServer(localItems: CartItem[]): Promise<void> {
	const { hydrateFromItems } = useCartStore.getState();

	const mergeItems = localItems.map(toMergeItem);
	const token = await getAuthToken();
	const response = await cartMergeGateway.merge(mergeItems, token);

	hydrateFromItems(toCartItems(response));
}

export function useCartSessionSync(): void {
	const { status } = useSession();
	const previousStatus = useRef<string | undefined>(undefined);

	useEffect(() => {
		const previous = previousStatus.current;
		previousStatus.current = status;

		const isTransitioningToAuthenticated =
			previous === "unauthenticated" && status === "authenticated";
		const isTransitioningToUnauthenticated =
			previous === "authenticated" && status === "unauthenticated";

		if (isTransitioningToAuthenticated) {
			const { items } = useCartStore.getState();
			if (items.length > 0) {
				mergeLocalCartWithServer(items).catch(() => {
					// Merge failure is non-fatal — local cart remains intact
				});
			}
			return;
		}

		if (isTransitioningToUnauthenticated) {
			useCartStore.getState().clearCart();
		}
	}, [status]);
}
