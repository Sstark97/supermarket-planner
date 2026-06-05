"use client";

import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryDateFormatter } from "@/features/shopping-history/model/ShoppingHistoryDateFormatter";
import { ShoppingHistoryBreakdownCalculator } from "@/features/shopping-history/model/ShoppingHistoryBreakdownCalculator";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineAccordion } from "./TimelineAccordion";

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
	dateFormatter: ShoppingHistoryDateFormatter;
	breakdownCalculator: ShoppingHistoryBreakdownCalculator;
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
	dateFormatter,
	breakdownCalculator,
}: TimelinePanelProps): React.ReactElement {
	return (
		<aside className="bg-white border border-slate-200 rounded-2xl p-4 h-fit space-y-4">
			<div>
				<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
					Timeline de compras
				</h2>
				<TimelineFilters
					searchTerm={searchTerm}
					onSearchTermChange={onSearchTermChange}
					supermarketFilter={supermarketFilter}
					onSupermarketFilterChange={onSupermarketFilterChange}
					supermarketOptions={supermarketOptions}
				/>
			</div>

			<TimelineAccordion
				groups={groups}
				selectedSessionId={selectedSessionId}
				onSelectSession={onSelectSession}
				openYearKeys={openYearKeys}
				onToggleYear={onToggleYear}
				openMonthKeys={openMonthKeys}
				onToggleMonth={onToggleMonth}
				dateFormatter={dateFormatter}
				breakdownCalculator={breakdownCalculator}
			/>
		</aside>
	);
}
