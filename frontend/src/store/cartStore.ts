import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/types";

export interface CartItem {
	itemKey: string;
	product: IProduct;
	quantity: number;
}

type CartRegistry = Record<string, CartItem>;

interface CartState {
	itemRegistry: CartRegistry;
	items: CartItem[];
	totalItems: number;
	totalPrice: number;
	isHydrated: boolean;
	addItem: (product: IProduct) => void;
	removeItem: (itemKey: string) => void;
	updateQuantity: (itemKey: string, delta: number) => void;
	clearCart: () => void;
	hydrateFromItems: (items: CartItem[]) => void;
}

class CartStateProjector {
	static createItemKey(product: Pick<IProduct, "supermarket" | "id">): string {
		return `${product.supermarket}:${product.id}`;
	}

	static toSnapshot(itemRegistry: CartRegistry) {
		const items = Object.values(itemRegistry);
		let totalItems = 0;
		let totalPrice = 0;

		for (const item of items) {
			totalItems += item.quantity;
			totalPrice += item.product.price * item.quantity;
		}

		return {
			itemRegistry,
			items,
			totalItems,
			totalPrice,
		};
	}

	static registryFromItems(items: CartItem[]): CartRegistry {
		return Object.fromEntries(items.map((item) => [item.itemKey, item]));
	}
}

const initialSnapshot = CartStateProjector.toSnapshot({});

export const useCartStore = create<CartState>()(
	persist(
		(set) => ({
			...initialSnapshot,
			isHydrated: false,

			addItem: (product) => {
				set((state) => {
					const itemKey = CartStateProjector.createItemKey(product);
					const existingItem = state.itemRegistry[itemKey];
					const nextItem: CartItem = existingItem
						? { ...existingItem, quantity: existingItem.quantity + 1 }
						: { itemKey, product, quantity: 1 };

					const nextRegistry: CartRegistry = {
						...state.itemRegistry,
						[itemKey]: nextItem,
					};

					return CartStateProjector.toSnapshot(nextRegistry);
				});
			},

			removeItem: (itemKey) => {
				set((state) => {
					if (!state.itemRegistry[itemKey]) {
						return state;
					}

					const nextRegistry = { ...state.itemRegistry };
					delete nextRegistry[itemKey];
					return CartStateProjector.toSnapshot(nextRegistry);
				});
			},

			updateQuantity: (itemKey, delta) => {
				set((state) => {
					const currentItem = state.itemRegistry[itemKey];
					if (!currentItem) {
						return state;
					}

					const nextQuantity = currentItem.quantity + delta;
					const nextRegistry = { ...state.itemRegistry };

					if (nextQuantity <= 0) {
						delete nextRegistry[itemKey];
					} else {
						nextRegistry[itemKey] = { ...currentItem, quantity: nextQuantity };
					}

					return CartStateProjector.toSnapshot(nextRegistry);
				});
			},

			clearCart: () => set({ ...CartStateProjector.toSnapshot({}), isHydrated: true }),

			hydrateFromItems: (items) => {
				const nextRegistry = CartStateProjector.registryFromItems(items);
				set({ ...CartStateProjector.toSnapshot(nextRegistry), isHydrated: true });
			},
		}),
		{
			name: "supermarket-planner-cart",
			partialize: (state) => ({ itemRegistry: state.itemRegistry }),
			merge: (persistedState, currentState) => {
				const persisted = persistedState as { itemRegistry?: CartRegistry };
				const registry = persisted.itemRegistry ?? {};
				return {
					...currentState,
					...CartStateProjector.toSnapshot(registry),
					isHydrated: true,
				};
			},
		},
	),
);
