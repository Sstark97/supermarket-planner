import { create } from "zustand";

interface FilterUiState {
	isOpen: boolean;
	openFilter: () => void;
	closeFilter: () => void;
}

export const useFilterUiStore = create<FilterUiState>((set) => ({
	isOpen: false,
	openFilter: () => set({ isOpen: true }),
	closeFilter: () => set({ isOpen: false }),
}));
