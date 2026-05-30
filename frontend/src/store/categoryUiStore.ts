import { create } from "zustand";

interface CategoryUiState {
	isVisible: boolean;
	toggleCategories: () => void;
}

export const useCategoryUiStore = create<CategoryUiState>((set) => ({
	isVisible: true,
	toggleCategories: () => set((state) => ({ isVisible: !state.isVisible })),
}));
