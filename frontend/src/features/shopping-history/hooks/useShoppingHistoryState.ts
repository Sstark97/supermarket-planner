"use client";

import type { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryEntryFilter } from "@/features/shopping-history/model/ShoppingHistoryEntryFilter";
import { ShoppingHistoryTimelineGrouper } from "@/features/shopping-history/model/ShoppingHistoryTimelineGrouper";
import { ShoppingHistoryAccordionStateProjector } from "@/features/shopping-history/model/ShoppingHistoryAccordionStateProjector";
import { ShoppingHistoryDeleteCoordinator } from "@/features/shopping-history/model/ShoppingHistoryDeleteCoordinator";
import { useShoppingHistoryEntries } from "./useShoppingHistoryEntries";
import { useShoppingHistoryFilters } from "./useShoppingHistoryFilters";
import {
	useShoppingHistorySelection,
	type ShoppingHistorySelectionState,
} from "./useShoppingHistorySelection";
import { useShoppingHistoryAccordion } from "./useShoppingHistoryAccordion";
import { useShoppingHistoryDelete } from "./useShoppingHistoryDelete";

interface ShoppingHistoryStateDependencies {
	shoppingSessionGateway: ShoppingSessionGateway;
	entryFilter: ShoppingHistoryEntryFilter;
	timelineGrouper: ShoppingHistoryTimelineGrouper;
	accordionStateProjector: ShoppingHistoryAccordionStateProjector;
	deleteCoordinator: ShoppingHistoryDeleteCoordinator;
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
	isDeleteDialogOpen: boolean;
	isDeletingSession: boolean;
	openDeleteConfirmation: (sessionId: string) => void;
	closeDeleteConfirmation: () => void;
	confirmDeleteSession: () => Promise<void>;
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
		deleteCoordinator,
	} = dependencies;

	const { entries, isLoading, errorMessage, removeEntryBySessionId } =
		useShoppingHistoryEntries(status, shoppingSessionGateway);

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

	const {
		isConfirmationDialogOpen,
		isDeleting,
		openDeleteConfirmation,
		closeDeleteConfirmation,
		confirmDelete,
	} = useShoppingHistoryDelete(deleteCoordinator, removeEntryBySessionId);

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
		isDeleteDialogOpen: isConfirmationDialogOpen,
		isDeletingSession: isDeleting,
		openDeleteConfirmation,
		closeDeleteConfirmation,
		confirmDeleteSession: confirmDelete,
	};
}
