import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocationState {
	postalCode: string | null;
	isModalOpen: boolean;
	isHydrated: boolean;
	setPostalCode: (postalCode: string | null) => void;
	openModal: () => void;
	closeModal: () => void;
}

export const useLocationStore = create<LocationState>()(
	persist(
		(set) => ({
			postalCode: null,
			isModalOpen: false,
			isHydrated: false,

			setPostalCode: (postalCode) => set({ postalCode }),
			openModal: () => set({ isModalOpen: true }),
			closeModal: () => set({ isModalOpen: false }),
		}),
		{
			name: "supermarket-planner-location",
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({ postalCode: state.postalCode }),
			merge: (persistedState, currentState) => {
				const persisted = persistedState as { postalCode?: string | null };
				return {
					...currentState,
					postalCode: persisted.postalCode ?? null,
					isHydrated: true,
				};
			},
		},
	),
);
