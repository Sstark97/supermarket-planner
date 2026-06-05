"use client";

export type ShoppingHistoryViewMode = "history" | "insights";

interface ShoppingHistoryViewTabsProps {
	activeView: ShoppingHistoryViewMode;
	onViewChange: (view: ShoppingHistoryViewMode) => void;
}

export function ShoppingHistoryViewTabs({
	activeView,
	onViewChange,
}: ShoppingHistoryViewTabsProps): React.ReactElement {
	return (
		<div
			role="tablist"
			aria-label="Vistas de historial"
			className="inline-flex p-1 bg-slate-100 rounded-xl"
		>
			<button
				role="tab"
				aria-selected={activeView === "history"}
				onClick={() => onViewChange("history")}
				className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
					activeView === "history"
						? "bg-white text-slate-900 shadow-sm"
						: "text-slate-600 hover:text-slate-800"
				}`}
			>
				Historial
			</button>
			<button
				role="tab"
				aria-selected={activeView === "insights"}
				onClick={() => onViewChange("insights")}
				className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
					activeView === "insights"
						? "bg-white text-slate-900 shadow-sm"
						: "text-slate-600 hover:text-slate-800"
				}`}
			>
				Analítica
			</button>
		</div>
	);
}
