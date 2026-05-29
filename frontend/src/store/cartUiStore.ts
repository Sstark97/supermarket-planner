import { create } from "zustand";

interface CartUiState {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	open: () => void;
	close: () => void;
}

export const useCartUiStore = create<CartUiState>((set) => ({
	isOpen: false,
	setIsOpen: (isOpen) => set({ isOpen }),
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
}));
