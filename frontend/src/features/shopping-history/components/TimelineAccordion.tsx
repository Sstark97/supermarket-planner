"use client";

import { ChevronDown } from "lucide-react";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryDateFormatter } from "@/features/shopping-history/model/ShoppingHistoryDateFormatter";
import { ShoppingHistoryBreakdownCalculator } from "@/features/shopping-history/model/ShoppingHistoryBreakdownCalculator";

interface TimelineAccordionProps {
	groups: YearGroup[];
	selectedSessionId: string | null;
	onSelectSession: (sessionId: string) => void;
	openYearKeys: string[];
	onToggleYear: (yearKey: string) => void;
	openMonthKeys: string[];
	onToggleMonth: (monthKey: string) => void;
	dateFormatter: ShoppingHistoryDateFormatter;
	breakdownCalculator: ShoppingHistoryBreakdownCalculator;
}

interface YearSectionProps {
	yearGroup: YearGroup;
	selectedSessionId: string | null;
	onSelectSession: (sessionId: string) => void;
	isOpen: boolean;
	onToggleYear: (yearKey: string) => void;
	openMonthKeys: string[];
	onToggleMonth: (monthKey: string) => void;
	dateFormatter: ShoppingHistoryDateFormatter;
	breakdownCalculator: ShoppingHistoryBreakdownCalculator;
}

function YearSection({
	yearGroup,
	selectedSessionId,
	onSelectSession,
	isOpen,
	onToggleYear,
	openMonthKeys,
	onToggleMonth,
	dateFormatter,
	breakdownCalculator,
}: YearSectionProps): React.ReactElement {
	const purchasesCount = yearGroup.months.reduce(
		(totalEntries, monthGroup) => totalEntries + monthGroup.entries.length,
		0,
	);

	return (
		<div className="border border-slate-200 rounded-xl">
			<button
				onClick={() => onToggleYear(yearGroup.yearKey)}
				className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
			>
				<span className="font-semibold text-slate-800">
					{yearGroup.yearLabel} ({purchasesCount})
				</span>
				<ChevronDown
					size={16}
					className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div className="px-2 pb-2 space-y-2">
					{yearGroup.months.map((monthGroup) => {
						const isMonthOpen = openMonthKeys.includes(monthGroup.monthKey);
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
										{monthGroup.monthLabel} ({monthGroup.entries.length})
									</span>
									<ChevronDown
										size={14}
										className={`text-slate-400 transition-transform ${isMonthOpen ? "rotate-180" : ""}`}
									/>
								</button>

								{isMonthOpen && (
									<ul className="px-2 pb-2 space-y-1.5">
										{monthGroup.entries.map((entry) => (
											<PurchaseEntryRow
												key={entry.sessionId}
												entry={entry}
												selectedSessionId={selectedSessionId}
												onSelectSession={onSelectSession}
												dateFormatter={dateFormatter}
												breakdownCalculator={breakdownCalculator}
											/>
										))}
									</ul>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

interface PurchaseEntryRowProps {
	entry: ShoppingSessionHistoryEntry;
	selectedSessionId: string | null;
	onSelectSession: (sessionId: string) => void;
	dateFormatter: ShoppingHistoryDateFormatter;
	breakdownCalculator: ShoppingHistoryBreakdownCalculator;
}

function PurchaseEntryRow({
	entry,
	selectedSessionId,
	onSelectSession,
	dateFormatter,
	breakdownCalculator,
}: PurchaseEntryRowProps): React.ReactElement {
	const isSelected = selectedSessionId === entry.sessionId;
	const purchasedUnitsCount = breakdownCalculator.countPurchasedUnits(entry);

	return (
		<li>
			<button
				onClick={() => onSelectSession(entry.sessionId)}
				className={`w-full text-left p-2.5 rounded-lg border border-l-4 transition-colors ${
					isSelected
						? "border-l-kilox-cyan border-slate-200 bg-slate-50 text-slate-900"
						: "border-l-transparent border-slate-200 hover:border-slate-300"
				}`}
			>
				<p className="text-sm font-semibold">{entry.totalPrice.toFixed(2)}€</p>
				<p
					className={`text-xs ${isSelected ? "text-kilox-sapphire" : "text-slate-500"}`}
				>
					{dateFormatter.formatCalendarDate(entry.shoppedAt)} ·{" "}
					{purchasedUnitsCount} uds
				</p>
			</button>
		</li>
	);
}

export function TimelineAccordion({
	groups,
	selectedSessionId,
	onSelectSession,
	openYearKeys,
	onToggleYear,
	openMonthKeys,
	onToggleMonth,
	dateFormatter,
	breakdownCalculator,
}: TimelineAccordionProps): React.ReactElement {
	return (
		<div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
			{groups.map((yearGroup) => (
				<YearSection
					key={yearGroup.yearKey}
					yearGroup={yearGroup}
					selectedSessionId={selectedSessionId}
					onSelectSession={onSelectSession}
					isOpen={openYearKeys.includes(yearGroup.yearKey)}
					onToggleYear={onToggleYear}
					openMonthKeys={openMonthKeys}
					onToggleMonth={onToggleMonth}
					dateFormatter={dateFormatter}
					breakdownCalculator={breakdownCalculator}
				/>
			))}
		</div>
	);
}
