"use client";

import { Search, Store } from "lucide-react";
import { useRouter } from "next/navigation";

interface TimelineFiltersProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	supermarketFilter: string;
	onSupermarketFilterChange: (value: string) => void;
	supermarketOptions: string[];
}

export function TimelineFilters({
	searchTerm,
	onSearchTermChange,
	supermarketFilter,
	onSupermarketFilterChange,
	supermarketOptions,
}: TimelineFiltersProps): React.ReactElement {
	const router = useRouter();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		const query = searchTerm.trim();
		if (query.length === 0) {
			return;
		}
		router.push(`/?q=${encodeURIComponent(query)}`);
	};

	return (
		<div className="space-y-3">
			<form onSubmit={handleSubmit} className="relative">
				<Search
					size={16}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
				/>
				<input
					type="text"
					value={searchTerm}
					onChange={(event) => onSearchTermChange(event.target.value)}
					placeholder="Buscar y abrir en productos..."
					className="w-full pl-9 pr-20 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
				/>
				<button
					type="submit"
					className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
					disabled={searchTerm.trim().length === 0}
				>
					Buscar
				</button>
			</form>

			<div className="flex flex-wrap items-center gap-1.5 md:gap-2">
				<button
					onClick={() => onSupermarketFilterChange("all")}
					className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap border transition-colors ${
						supermarketFilter === "all"
							? "bg-slate-900 text-white border-slate-900"
							: "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
					}`}
				>
					Todos
				</button>

				{supermarketOptions.map((supermarket) => {
					const isActive = supermarketFilter === supermarket;
					return (
						<button
							key={supermarket}
							onClick={() => onSupermarketFilterChange(supermarket)}
							className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap border transition-colors capitalize ${
								isActive
									? "bg-slate-900 text-white border-slate-900"
									: "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
							}`}
						>
							<Store size={11} className="inline mr-0.5 md:mr-1" />
							{supermarket}
						</button>
					);
				})}
			</div>
		</div>
	);
}
