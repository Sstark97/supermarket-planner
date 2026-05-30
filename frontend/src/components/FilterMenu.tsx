"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useFilterUiStore } from "@/store/filterUiStore";
import { MobileFilterDrawer } from "./MobileFilterDrawer";

const SUPERMARKETS = ["Mercadona", "Aldi", "HiperDino", "Carrefour"];

interface FilterPanelContentProps {
	currentSupermarket: string;
	currentSortBy: string;
	isPending: boolean;
	onSupermarketChange: (shop: string) => void;
	onSortChange: (value: string) => void;
	onReset: () => void;
	onClose: () => void;
}

function FilterPanelContent({
	currentSupermarket,
	currentSortBy,
	isPending,
	onSupermarketChange,
	onSortChange,
	onReset,
	onClose,
}: FilterPanelContentProps): React.ReactElement {
	const pendingStyle = isPending ? "opacity-50 cursor-not-allowed" : "";

	return (
		<div className="space-y-6">
			{/* Supermarkets */}
			<div>
				<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
					Supermercado
				</h3>
				<div className="flex flex-wrap gap-2">
					{SUPERMARKETS.map((shop) => (
						<button
							key={shop}
							disabled={isPending}
							onClick={() => onSupermarketChange(shop)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${pendingStyle} ${
								currentSupermarket === shop
									? "bg-blue-600 text-white shadow-md shadow-blue-200"
									: "bg-slate-50 text-slate-600 hover:bg-slate-100"
							}`}
						>
							{shop}
						</button>
					))}
				</div>
			</div>

			{/* Sorting */}
			<div>
				<h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
					Ordenar por precio
				</h3>
				<div className="grid grid-cols-2 gap-2">
					<button
						disabled={isPending}
						onClick={() => onSortChange("price_asc")}
						className={`px-3 py-2 rounded-lg text-xs font-medium text-center transition-all ${pendingStyle} ${
							currentSortBy === "price_asc"
								? "bg-blue-600 text-white shadow-md shadow-blue-200"
								: "bg-slate-50 text-slate-600 hover:bg-slate-100"
						}`}
					>
						Más barato primero
					</button>
					<button
						disabled={isPending}
						onClick={() => onSortChange("price_desc")}
						className={`px-3 py-2 rounded-lg text-xs font-medium text-center transition-all ${pendingStyle} ${
							currentSortBy === "price_desc"
								? "bg-blue-600 text-white shadow-md shadow-blue-200"
								: "bg-slate-50 text-slate-600 hover:bg-slate-100"
						}`}
					>
						Más caro primero
					</button>
				</div>
			</div>

			{/* Actions */}
			<div className="pt-2 border-t border-slate-50 flex items-center justify-between">
				<button
					onClick={onReset}
					className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors min-h-11 px-2"
				>
					Restablecer todo
				</button>
				<button
					onClick={onClose}
					className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors min-h-11"
				>
					Aplicar
				</button>
			</div>
		</div>
	);
}

function FilterTriggerButton({
	hasActiveFilters,
	onClick,
}: {
	hasActiveFilters: boolean;
	onClick: () => void;
}): React.ReactElement {
	return (
		<button
			onClick={onClick}
			className="flex items-center gap-2 px-4 min-h-11 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
			</svg>
			Filtros y Orden
			{hasActiveFilters && (
				<span className="flex h-2 w-2 rounded-full bg-blue-500" />
			)}
		</button>
	);
}

export function FilterMenu(): React.ReactElement {
	const router = useRouter();
	const { searchParams, buildMergedHref } = useQueryParams();
	const { isOpen, openFilter, closeFilter } = useFilterUiStore();
	const [isPending, startTransition] = useTransition();

	const currentSupermarket = searchParams.get("supermarket") || "";
	const currentSortBy = searchParams.get("sortBy") || "";
	const hasActiveFilters = Boolean(currentSupermarket || currentSortBy);

	const updateFilters = (key: string, value: string): void => {
		startTransition(() => {
			router.push(buildMergedHref({ [key]: value }), { scroll: false });
		});
	};

	const handleSupermarketChange = (shop: string): void => {
		updateFilters("supermarket", currentSupermarket === shop ? "" : shop);
	};

	const handleSortChange = (value: string): void => {
		updateFilters("sortBy", currentSortBy === value ? "" : value);
	};

	const resetFilters = (): void => {
		startTransition(() => {
			router.push(
				buildMergedHref({ supermarket: null, sortBy: null }),
				{ scroll: false },
			);
			closeFilter();
		});
	};

	const panelContent = (
		<FilterPanelContent
			currentSupermarket={currentSupermarket}
			currentSortBy={currentSortBy}
			isPending={isPending}
			onSupermarketChange={handleSupermarketChange}
			onSortChange={handleSortChange}
			onReset={resetFilters}
			onClose={closeFilter}
		/>
	);

	return (
		<div className="relative">
			{/* Desktop: trigger + dropdown. Hidden on mobile — MobileBottomNav covers filter access */}
			<div className="relative hidden md:block">
				<FilterTriggerButton
					hasActiveFilters={hasActiveFilters}
					onClick={() => (isOpen ? closeFilter() : openFilter())}
				/>

				{isOpen && (
					<>
						<div
							className="fixed inset-0 z-40"
							onClick={closeFilter}
							aria-hidden="true"
						/>
						<div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in duration-200">
							{panelContent}
						</div>
					</>
				)}
			</div>

			{/* Mobile drawer — hidden on desktop. display:none on parent hides fixed children too. */}
			<div className="md:hidden">
				<MobileFilterDrawer isOpen={isOpen} onClose={closeFilter}>
					{panelContent}
				</MobileFilterDrawer>
			</div>
		</div>
	);
}
