import { useState } from "react";
import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryAccordionStateProjector } from "@/features/shopping-history/model/ShoppingHistoryAccordionStateProjector";

interface ShoppingHistoryAccordionState {
	openYearKeys: string[];
	openMonthKeys: string[];
	handleToggleYear: (yearKey: string) => void;
	handleToggleMonth: (monthKey: string) => void;
}

interface DefaultAccordionKeys {
	yearKeys: string[];
	monthKeys: string[];
}

export function useShoppingHistoryAccordion(
	groupedEntries: YearGroup[],
	accordionStateProjector: ShoppingHistoryAccordionStateProjector,
): ShoppingHistoryAccordionState {
	const [hasAccordionInteraction, setHasAccordionInteraction] =
		useState<boolean>(false);
	const [userOpenYearKeys, setUserOpenYearKeys] = useState<string[]>([]);
	const [userOpenMonthKeys, setUserOpenMonthKeys] = useState<string[]>([]);

	const availableKeys =
		accordionStateProjector.projectAvailableKeys(groupedEntries);
	const defaultOpenKeys = projectDefaultOpenKeys(groupedEntries);

	const effectiveOpenYearKeys = hasAccordionInteraction
		? accordionStateProjector.pruneUnavailableKeys(
				userOpenYearKeys,
				availableKeys.yearKeys,
			)
		: defaultOpenKeys.yearKeys;

	const effectiveOpenMonthKeys = hasAccordionInteraction
		? accordionStateProjector.pruneUnavailableKeys(
				userOpenMonthKeys,
				availableKeys.monthKeys,
			)
		: defaultOpenKeys.monthKeys;

	function handleToggleYear(yearKey: string): void {
		setHasAccordionInteraction(true);
		setUserOpenYearKeys((previousUserOpenYearKeys) => {
			const toggleBase = hasAccordionInteraction
				? previousUserOpenYearKeys
				: effectiveOpenYearKeys;

			return toggleBase.includes(yearKey)
				? toggleBase.filter((openYearKey) => openYearKey !== yearKey)
				: [...toggleBase, yearKey];
		});
	}

	function handleToggleMonth(monthKey: string): void {
		setHasAccordionInteraction(true);
		setUserOpenMonthKeys((previousUserOpenMonthKeys) => {
			const toggleBase = hasAccordionInteraction
				? previousUserOpenMonthKeys
				: effectiveOpenMonthKeys;

			return toggleBase.includes(monthKey)
				? toggleBase.filter((openMonthKey) => openMonthKey !== monthKey)
				: [...toggleBase, monthKey];
		});
	}

	return {
		openYearKeys: effectiveOpenYearKeys,
		openMonthKeys: effectiveOpenMonthKeys,
		handleToggleYear,
		handleToggleMonth,
	};
}

function projectDefaultOpenKeys(
	groupedEntries: YearGroup[],
): DefaultAccordionKeys {
	if (groupedEntries.length === 0) {
		return {
			yearKeys: [],
			monthKeys: [],
		};
	}

	return {
		yearKeys: [groupedEntries[0].yearKey],
		monthKeys: groupedEntries[0].months.map((month) => month.monthKey),
	};
}
