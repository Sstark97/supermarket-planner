"use client";

import type { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryEntryFilter } from "@/features/shopping-history/model/ShoppingHistoryEntryFilter";
import { ShoppingHistoryTimelineGrouper } from "@/features/shopping-history/model/ShoppingHistoryTimelineGrouper";
import { ShoppingHistoryAccordionStateProjector } from "@/features/shopping-history/model/ShoppingHistoryAccordionStateProjector";
import { useShoppingHistoryEntries } from "./useShoppingHistoryEntries";
import { useShoppingHistoryFilters } from "./useShoppingHistoryFilters";
import {
	useShoppingHistorySelection,
	type ShoppingHistorySelectionState,
} from "./useShoppingHistorySelection";
import { useShoppingHistoryAccordion } from "./useShoppingHistoryAccordion";

interface ShoppingHistoryStateDependencies {
	shoppingSessionGateway: ShoppingSessionGateway;
	entryFilter: ShoppingHistoryEntryFilter;
	timelineGrouper: ShoppingHistoryTimelineGrouper;
	accordionStateProjector: ShoppingHistoryAccordionStateProjector;
}

interface ShoppingHistoryState {
	filteredEntries: ReturnType<
		typeof useShoppingHistoryFilters
	>["filteredEntries"];
	groupedEntries: YearGroup[];
	supermarketOptions: string[];
	selectedSessionId: string | null;
	selectedEntry: ShoppingHistorySelectionState["selectedEntry"];
	isLoading: boolean;
	errorMessage: string | null;
	mobileViewMode: ShoppingHistorySelectionState["mobileViewMode"];
	searchTerm: string;
	supermarketFilter: string;
	openYearKeys: string[];
	openMonthKeys: string[];
	setSearchTerm: (value: string) => void;
	setSupermarketFilter: (value: string) => void;
	handleToggleYear: (yearKey: string) => void;
	handleToggleMonth: (monthKey: string) => void;
	handleSelectSession: (sessionId: string) => void;
	setSelectedSessionId: (sessionId: string | null) => void;
	setMobileViewMode: ShoppingHistorySelectionState["setMobileViewMode"];
}

export function useShoppingHistoryState(
	status: string,
	dependencies: ShoppingHistoryStateDependencies,
): ShoppingHistoryState {
	const {
		shoppingSessionGateway,
		entryFilter,
		timelineGrouper,
		accordionStateProjector,
	} = dependencies;

	const { entries, isLoading, errorMessage } = useShoppingHistoryEntries(
		status,
		shoppingSessionGateway,
	);

	const {
		searchTerm,
		supermarketFilter,
		setSearchTerm,
		setSupermarketFilter,
		filteredEntries,
		groupedEntries,
		supermarketOptions,
	} = useShoppingHistoryFilters(entries, entryFilter, timelineGrouper);

	const {
		selectedSessionId,
		selectedEntry,
		mobileViewMode,
		handleSelectSession,
		setSelectedSessionId,
		setMobileViewMode,
	} = useShoppingHistorySelection(filteredEntries);

	const { openYearKeys, openMonthKeys, handleToggleYear, handleToggleMonth } =
		useShoppingHistoryAccordion(groupedEntries, accordionStateProjector);

	return {
		filteredEntries,
		groupedEntries,
		supermarketOptions,
		selectedSessionId,
		selectedEntry,
		isLoading,
		errorMessage,
		mobileViewMode,
		searchTerm,
		supermarketFilter,
		openYearKeys,
		openMonthKeys,
		setSearchTerm,
		setSupermarketFilter,
		handleToggleYear,
		handleToggleMonth,
		handleSelectSession,
		setSelectedSessionId,
		setMobileViewMode,
	};
}
