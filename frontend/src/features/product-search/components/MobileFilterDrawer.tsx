"use client";

import { X } from "lucide-react";

interface MobileFilterDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

export function MobileFilterDrawer({
	isOpen,
	onClose,
	children,
}: MobileFilterDrawerProps): React.ReactElement | null {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filtros y Orden">
			{/* Backdrop */}
			<div
				data-testid="drawer-backdrop"
				className="absolute inset-0 bg-slate-900/50"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Drawer panel */}
			<div className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
				{/* Drag handle */}
				<div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1" aria-hidden="true" />

				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3">
					<h2 className="text-base font-semibold text-slate-900">Filtros y Orden</h2>
					<button
						onClick={onClose}
						className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
						aria-label="Cerrar filtros"
					>
						<X size={20} />
					</button>
				</div>

				{/* Scrollable content */}
				<div className="overflow-y-auto flex-1 px-5 pb-4">
					{children}
				</div>
			</div>
		</div>
	);
}
