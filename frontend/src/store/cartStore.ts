import { create } from 'zustand';
import { IProduct } from '../types';

export interface CartItem {
    product: IProduct;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    addItem: (product: IProduct) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, delta: number) => void;
    setIsOpen: (isOpen: boolean) => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    isOpen: false,

    addItem: (product) => {
        set((state) => {
            const existing = state.items.find((item) => item.product.id === product.id);
            if (existing) {
                return {
                    items: state.items.map((item) =>
                        item.product.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                };
            }
            return { items: [...state.items, { product, quantity: 1 }] };
        });
    },

    removeItem: (productId) => {
        set((state) => ({
            items: state.items.filter((item) => item.product.id !== productId),
        }));
    },

    updateQuantity: (productId, delta) => {
        set((state) => ({
            items: state.items.map((item) => {
                if (item.product.id === productId) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            }).filter((item) => item.quantity > 0),
        }));
    },

    setIsOpen: (isOpen) => set({ isOpen }),

    totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
    },

    totalPrice: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    },
}));
