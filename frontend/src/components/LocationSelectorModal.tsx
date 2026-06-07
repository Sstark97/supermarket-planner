"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { useLocationStore } from "@/store/locationStore";
import { SpanishProvinceResolver } from "./spanishProvinceCodes";

const POSTAL_CODE_PATTERN = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
const INVALID_POSTAL_CODE_MESSAGE = "Código postal no válido";
const PROVINCE_PREFIX_LENGTH = 2;

class PostalCodeValidator {
	static isValid(value: string): boolean {
		return POSTAL_CODE_PATTERN.test(value);
	}
}

function resolveProvinceHint(draft: string): string | null {
	if (draft.length < PROVINCE_PREFIX_LENGTH) {
		return null;
	}

	return SpanishProvinceResolver.resolveByPrefix(draft.slice(0, PROVINCE_PREFIX_LENGTH));
}

export function LocationSelectorModal(): React.ReactElement {
	const postalCode = useLocationStore((state) => state.postalCode);
	const setPostalCode = useLocationStore((state) => state.setPostalCode);
	const closeModal = useLocationStore((state) => state.closeModal);

	const [draft, setDraft] = useState(postalCode ?? "");
	const [error, setError] = useState<string | null>(null);
	const provinceHint = resolveProvinceHint(draft);

	const handleSave = (): void => {
		if (!PostalCodeValidator.isValid(draft)) {
			setError(INVALID_POSTAL_CODE_MESSAGE);
			return;
		}

		setError(null);
		setPostalCode(draft);
		closeModal();
	};

	const handleClear = (): void => {
		setDraft("");
		setError(null);
		setPostalCode(null);
	};

	return (
		<div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-20 sm:pt-32">
			<div
				role="presentation"
				aria-label="Cerrar selector de ubicación"
				data-testid="location-selector-overlay"
				className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
				onClick={closeModal}
			/>

			<div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
						<MapPin size={20} className="text-blue-600" />
						Tu código postal
					</h2>
					<button
						onClick={closeModal}
						aria-label="Cerrar"
						className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<div className="flex flex-col gap-2">
					<input
						type="text"
						inputMode="numeric"
						maxLength={5}
						pattern="[0-9]*"
						value={draft}
						onChange={(event) => {
							setDraft(event.target.value);
							setError(null);
						}}
						placeholder="35001"
						className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					{error && <p className="text-sm text-red-600">{error}</p>}
					{!error && provinceHint && <p className="text-sm text-slate-500">{provinceHint}</p>}
				</div>

				<div className="flex gap-3">
					<button
						onClick={handleClear}
						className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
					>
						Limpiar
					</button>
					<button
						onClick={handleSave}
						className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}
