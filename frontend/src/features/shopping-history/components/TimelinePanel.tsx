"use client";

import { ChevronDown, Search, Store } from "lucide-react";
import type { YearGroup } from "@/features/shopping-history/model/types";
import {
	formatDate,
	sumSessionItems,
} from "@/features/shopping-history/model/utils";

interface TimelinePanelProps {
	groups: YearGroup[];
	selectedSessionId: string | null;
	onSelectSession: (sessionId: string) => void;
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	supermarketFilter: string;
	onSupermarketFilterChange: (value: string) => void;
	supermarketOptions: string[];
	openYearKeys: string[];
	onToggleYear: (yearKey: string) => void;
	openMonthKeys: string[];
	onToggleMonth: (monthKey: string) => void;
}

export function TimelinePanel({
	groups,
	selectedSessionId,
	onSelectSession,
	searchTerm,
	onSearchTermChange,
	supermarketFilter,
	onSupermarketFilterChange,
	supermarketOptions,
	openYearKeys,
	onToggleYear,
	openMonthKeys,
	onToggleMonth,
}: TimelinePanelProps): React.ReactElement {
	return (
		<aside className="bg-white border border-slate-200 rounded-2xl p-4 h-fit space-y-4">
			<div>
				<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
					Timeline de compras
				</h2>
				<div className="space-y-3">
					<div className="relative">
						<Search
							size={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<input
							type="text"
							value={searchTerm}
							onChange={(event) => onSearchTermChange(event.target.value)}
							placeholder="Buscar producto..."
							className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
						/>
					</div>

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
			</div>

			<div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
				{groups.map((yearGroup) => {
					const isYearOpen = openYearKeys.includes(yearGroup.yearKey);
					const yearCount = yearGroup.months.reduce(
						(acc, monthGroup) => acc + monthGroup.entries.length,
						0,
					);

					return (
						<div
							key={yearGroup.yearKey}
							className="border border-slate-200 rounded-xl"
						>
							<button
								onClick={() => onToggleYear(yearGroup.yearKey)}
								className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
							>
								<span className="font-semibold text-slate-800">
									{yearGroup.yearLabel} ({yearCount})
								</span>
								<ChevronDown
									size={16}
									className={`text-slate-500 transition-transform ${isYearOpen ? "rotate-180" : ""}`}
								/>
							</button>

							{isYearOpen && (
								<div className="px-2 pb-2 space-y-2">
									{yearGroup.months.map((monthGroup) => {
										const isMonthOpen = openMonthKeys.includes(
											monthGroup.monthKey,
										);

										return (
											<div
												key={monthGroup.monthKey}
												className="border border-slate-100 rounded-lg"
											>
												<button
													onClick={() => onToggleMonth(monthGroup.monthKey)}
													className="w-full px-2.5 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
												>
													<span className="text-sm font-medium text-slate-700">
														{monthGroup.monthLabel} ({monthGroup.entries.length}
														)
													</span>
													<ChevronDown
														size={14}
														className={`text-slate-400 transition-transform ${isMonthOpen ? "rotate-180" : ""}`}
													/>
												</button>

												{isMonthOpen && (
													<ul className="px-2 pb-2 space-y-1.5">
														{monthGroup.entries.map((entry) => {
															const isSelected =
																selectedSessionId === entry.sessionId;

															return (
																<li key={entry.sessionId}>
																	<button
																		onClick={() =>
																			onSelectSession(entry.sessionId)
																		}
																		className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
																			isSelected
																				? "border-slate-900 bg-slate-900 text-white"
																				: "border-slate-200 hover:border-slate-300"
																		}`}
																	>
																		<p className="text-sm font-semibold">
																			{entry.totalPrice.toFixed(2)}€
																		</p>
																		<p
																			className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}
																		>
																			{formatDate(entry.shoppedAt)} ·{" "}
																			{sumSessionItems(entry)} uds
																		</p>
																	</button>
																</li>
															);
														})}
													</ul>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</aside>
	);
}
