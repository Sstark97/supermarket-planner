import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "./ShoppingHistoryContracts";
import { ShoppingHistoryDateFormatter } from "./ShoppingHistoryDateFormatter";

export class ShoppingHistoryTimelineGrouper {
	constructor(private readonly dateFormatter: ShoppingHistoryDateFormatter) {}

	groupByYearAndMonth(entries: ShoppingSessionHistoryEntry[]): YearGroup[] {
		const entriesByYearAndMonth: Record<
			string,
			Record<string, ShoppingSessionHistoryEntry[]>
		> = {};

		for (const entry of entries) {
			const shoppedAt = new Date(entry.shoppedAt);
			const yearKey = String(shoppedAt.getFullYear());
			const monthNumber = String(shoppedAt.getMonth() + 1).padStart(2, "0");
			const monthKey = `${yearKey}-${monthNumber}`;

			if (!entriesByYearAndMonth[yearKey]) {
				entriesByYearAndMonth[yearKey] = {};
			}

			if (!entriesByYearAndMonth[yearKey][monthKey]) {
				entriesByYearAndMonth[yearKey][monthKey] = [];
			}

			entriesByYearAndMonth[yearKey][monthKey].push(entry);
		}

		return Object.keys(entriesByYearAndMonth)
			.sort((leftYear, rightYear) => Number(rightYear) - Number(leftYear))
			.map((yearKey) => {
				const months = Object.keys(entriesByYearAndMonth[yearKey])
					.sort((leftMonth, rightMonth) => rightMonth.localeCompare(leftMonth))
					.map((monthKey) => {
						const [yearText, monthText] = monthKey.split("-");
						const year = Number(yearText);
						const monthIndex = Number(monthText) - 1;

						return {
							monthKey,
							monthLabel: this.dateFormatter.formatMonthLabel(year, monthIndex),
							entries: entriesByYearAndMonth[yearKey][monthKey],
						};
					});

				return {
					yearKey,
					yearLabel: yearKey,
					months,
				};
			});
	}
}
