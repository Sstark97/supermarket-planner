import type { YearGroup } from "./ShoppingHistoryContracts";

interface AccordionState {
	yearKeys: string[];
	monthKeys: string[];
}

export class ShoppingHistoryAccordionStateProjector {
	projectAvailableKeys(groupedEntries: YearGroup[]): AccordionState {
		return {
			yearKeys: groupedEntries.map((group) => group.yearKey),
			monthKeys: groupedEntries.flatMap((group) =>
				group.months.map((month) => month.monthKey),
			),
		};
	}

	pruneUnavailableKeys(openKeys: string[], availableKeys: string[]): string[] {
		return openKeys.filter((key) => availableKeys.includes(key));
	}

	hasSameKeys(leftKeys: string[], rightKeys: string[]): boolean {
		if (leftKeys.length !== rightKeys.length) {
			return false;
		}

		return leftKeys.every((key, index) => key === rightKeys[index]);
	}
}
