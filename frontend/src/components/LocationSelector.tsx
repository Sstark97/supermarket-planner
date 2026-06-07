"use client";

import { MapPin } from "lucide-react";
import { useLocationStore } from "@/store/locationStore";
import { LocationSelectorModal } from "./LocationSelectorModal";

export function LocationSelector(): React.ReactElement {
	const postalCode = useLocationStore((state) => state.postalCode);
	const isHydrated = useLocationStore((state) => state.isHydrated);
	const isModalOpen = useLocationStore((state) => state.isModalOpen);
	const openModal = useLocationStore((state) => state.openModal);

	const displayedPostalCode = isHydrated ? postalCode : null;

	return (
		<>
			<button
				onClick={openModal}
				className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
			>
				<MapPin size={16} />
				{displayedPostalCode ? (
					<span>{displayedPostalCode}</span>
				) : (
					<span className="hidden sm:inline">Tu zona</span>
				)}
			</button>
			{isModalOpen && <LocationSelectorModal />}
		</>
	);
}
