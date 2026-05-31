"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";

interface SaveShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateIso: string) => void;
  isLoading: boolean;
}

function todayAsIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SaveShoppingModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SaveShoppingModalProps): React.ReactElement | null {
  const [selectedDate, setSelectedDate] = useState(todayAsIsoDate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} />
            Guardar compra
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="shopping-date" className="text-sm font-medium text-slate-700">
            Fecha de la compra
          </label>
          <input
            id="shopping-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selectedDate)}
            disabled={isLoading || !selectedDate}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
