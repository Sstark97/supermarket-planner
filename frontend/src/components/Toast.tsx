"use client";

import { createContext, useContext, useState } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DISMISS_DELAY_MS = 4000;

function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function dismissToast(id: string): void {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  function showToast(message: string, type: ToastType): void {
    const id = generateToastId();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => dismissToast(id), TOAST_DISMISS_DELAY_MS);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 md:left-auto md:w-80 z-100 flex flex-col gap-2 items-center md:items-end pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`w-full pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
