import { useState } from "react";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryEntryFilter } from "@/features/shopping-history/model/ShoppingHistoryEntryFilter";
import { ShoppingHistoryTimelineGrouper } from "@/features/shopping-history/model/ShoppingHistoryTimelineGrouper";

interface ShoppingHistoryFiltersState {
	searchTerm: string;
	supermarketFilter: string;
	setSearchTerm: (value: string) => void;
	setSupermarketFilter: (value: string) => void;
	filteredEntries: ShoppingSessionHistoryEntry[];
	groupedEntries: YearGroup[];
	supermarketOptions: string[];
}

export function useShoppingHistoryFilters(
	entries: ShoppingSessionHistoryEntry[],
	entryFilter: ShoppingHistoryEntryFilter,
	timelineGrouper: ShoppingHistoryTimelineGrouper,
): ShoppingHistoryFiltersState {
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [supermarketFilter, setSupermarketFilter] = useState<string>("all");

	const filteredEntries = entryFilter.filterBySearchAndSupermarket(
		entries,
		searchTerm,
		supermarketFilter,
	);
	const groupedEntries = timelineGrouper.groupByYearAndMonth(filteredEntries);
	const supermarketOptions = entryFilter.collectSupermarketOptions(entries);

	return {
		searchTerm,
		supermarketFilter,
		setSearchTerm,
		setSupermarketFilter,
		filteredEntries,
		groupedEntries,
		supermarketOptions,
	};
}
