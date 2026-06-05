"use client";

import { useEffect, useState } from "react";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import { ClientContainerDI } from "@/lib/di/ClientContainerDI";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import type {
	ViewMode,
	YearGroup,
} from "@/features/shopping-history/model/types";
import {
	buildYearMonthGroups,
	filterShoppingEntries,
	getSupermarketOptions,
	haveSameKeys,
} from "@/features/shopping-history/model/utils";

const shoppingSessionGateway =
	new ClientContainerDI().resolveShoppingSessionGateway();

interface ShoppingHistoryState {
	entries: ShoppingSessionHistoryEntry[];
	filteredEntries: ShoppingSessionHistoryEntry[];
	groupedEntries: YearGroup[];
	supermarketOptions: string[];
	selectedSessionId: string | null;
	selectedEntry: ShoppingSessionHistoryEntry | null;
	isLoading: boolean;
	errorMessage: string | null;
	mobileViewMode: ViewMode;
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
	setMobileViewMode: (mode: ViewMode) => void;
}

export function useShoppingHistoryState(status: string): ShoppingHistoryState {
	const [entries, setEntries] = useState<ShoppingSessionHistoryEntry[]>([]);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [mobileViewMode, setMobileViewMode] = useState<ViewMode>("list");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [supermarketFilter, setSupermarketFilter] = useState<string>("all");
	const [openYearKeys, setOpenYearKeys] = useState<string[]>([]);
	const [openMonthKeys, setOpenMonthKeys] = useState<string[]>([]);
	const [hasInitializedAccordions, setHasInitializedAccordions] =
		useState<boolean>(false);

	useEffect(() => {
		if (status !== "authenticated") {
			setIsLoading(false);
			return;
		}

		let isCancelled = false;

		const load = async (): Promise<void> => {
			setIsLoading(true);
			setErrorMessage(null);
			try {
				const token = await getAuthToken();
				const response = await shoppingSessionGateway.list(token);
				if (isCancelled) return;

				setEntries(response.sessions);
				setSelectedSessionId(
					response.sessions.length > 0 ? response.sessions[0].sessionId : null,
				);
			} catch {
				if (!isCancelled) {
					setErrorMessage("No se pudo cargar el historial de compras.");
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		void load();

		return () => {
			isCancelled = true;
		};
	}, [status]);

	const normalizedSearch = searchTerm.trim().toLowerCase();
	const filteredEntries = filterShoppingEntries(
		entries,
		normalizedSearch,
		supermarketFilter,
	);
	const groupedEntries = buildYearMonthGroups(filteredEntries);
	const supermarketOptions = getSupermarketOptions(entries);
	const selectedEntry =
		filteredEntries.find((entry) => entry.sessionId === selectedSessionId) ??
		null;

	useEffect(() => {
		if (filteredEntries.length === 0) {
			setSelectedSessionId(null);
			setMobileViewMode("list");
			return;
		}

		const exists = filteredEntries.some(
			(entry) => entry.sessionId === selectedSessionId,
		);

		if (!exists) {
			setSelectedSessionId(filteredEntries[0].sessionId);
		}
	}, [filteredEntries, selectedSessionId]);

	useEffect(() => {
		const availableYearKeys = groupedEntries.map((group) => group.yearKey);
		const availableMonthKeys = groupedEntries.flatMap((group) =>
			group.months.map((month) => month.monthKey),
		);

		setOpenYearKeys((prev) => {
			const pruned = prev.filter((key) => availableYearKeys.includes(key));
			return haveSameKeys(prev, pruned) ? prev : pruned;
		});
		setOpenMonthKeys((prev) => {
			const pruned = prev.filter((key) => availableMonthKeys.includes(key));
			return haveSameKeys(prev, pruned) ? prev : pruned;
		});
	}, [entries, searchTerm, supermarketFilter, groupedEntries]);

	useEffect(() => {
		if (hasInitializedAccordions || groupedEntries.length === 0) {
			return;
		}

		setOpenYearKeys([groupedEntries[0].yearKey]);
		setOpenMonthKeys(groupedEntries[0].months.map((month) => month.monthKey));
		setHasInitializedAccordions(true);
	}, [
		entries,
		searchTerm,
		supermarketFilter,
		hasInitializedAccordions,
		groupedEntries,
	]);

	function handleToggleYear(yearKey: string): void {
		setHasInitializedAccordions(true);
		setOpenYearKeys((prev) =>
			prev.includes(yearKey)
				? prev.filter((key) => key !== yearKey)
				: [...prev, yearKey],
		);
	}

	function handleToggleMonth(monthKey: string): void {
		setHasInitializedAccordions(true);
		setOpenMonthKeys((prev) =>
			prev.includes(monthKey)
				? prev.filter((key) => key !== monthKey)
				: [...prev, monthKey],
		);
	}

	function handleSelectSession(sessionId: string): void {
		setSelectedSessionId(sessionId);
		setMobileViewMode("detail");
	}

	return {
		entries,
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
