"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteShoppingSessionConfirmationDialogProps {
	isOpen: boolean;
	isDeleting: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export function DeleteShoppingSessionConfirmationDialog({
	isOpen,
	isDeleting,
	onCancel,
	onConfirm,
}: DeleteShoppingSessionConfirmationDialogProps): React.ReactElement | null {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
				onClick={onCancel}
			/>

			<div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
						<AlertTriangle size={20} className="text-red-500" />
						Eliminar compra
					</h2>
					<button
						onClick={onCancel}
						disabled={isDeleting}
						className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-sm text-slate-700">
					¿Seguro que querés eliminar esta compra? Esta acción no se puede deshacer.
				</p>

				<div className="flex gap-3">
					<button
						onClick={onCancel}
						disabled={isDeleting}
						className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
						disabled={isDeleting}
						className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
					>
						{isDeleting ? "Eliminando…" : "Eliminar"}
					</button>
				</div>
			</div>
		</div>
	);
}
