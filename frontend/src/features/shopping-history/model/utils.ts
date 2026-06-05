import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "./types";

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString("es-ES", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function sumSessionItems(entry: ShoppingSessionHistoryEntry): number {
	return entry.items.reduce((acc, item) => acc + item.quantity, 0);
}

export function buildYearMonthGroups(
	entries: ShoppingSessionHistoryEntry[],
): YearGroup[] {
	const grouped: Record<
		string,
		Record<string, ShoppingSessionHistoryEntry[]>
	> = {};

	for (const entry of entries) {
		const date = new Date(entry.shoppedAt);
		const yearKey = String(date.getFullYear());
		const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
		const monthKey = `${yearKey}-${monthNumber}`;

		if (!grouped[yearKey]) {
			grouped[yearKey] = {};
		}

		if (!grouped[yearKey][monthKey]) {
			grouped[yearKey][monthKey] = [];
		}

		grouped[yearKey][monthKey].push(entry);
	}

	return Object.keys(grouped)
		.sort((a, b) => Number(b) - Number(a))
		.map((yearKey) => {
			const months = Object.keys(grouped[yearKey])
				.sort((a, b) => b.localeCompare(a))
				.map((monthKey) => {
					const [year, month] = monthKey.split("-");
					const monthLabel = new Date(Number(year), Number(month) - 1, 1)
						.toLocaleDateString("es-ES", {
							month: "long",
							year: "numeric",
						})
						.replace(/^./, (char) => char.toUpperCase());

					return {
						monthKey,
						monthLabel,
						entries: grouped[yearKey][monthKey],
					};
				});

			return {
				yearKey,
				yearLabel: yearKey,
				months,
			};
		});
}

export function buildSupermarketBreakdown(
	entry: ShoppingSessionHistoryEntry,
): Record<string, { total: number; items: number }> {
	return entry.items.reduce<Record<string, { total: number; items: number }>>(
		(acc, item) => {
			if (!acc[item.supermarket]) {
				acc[item.supermarket] = { total: 0, items: 0 };
			}

			acc[item.supermarket].total += item.price * item.quantity;
			acc[item.supermarket].items += item.quantity;
			return acc;
		},
		{},
	);
}

export function haveSameKeys(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	return a.every((key, index) => key === b[index]);
}

export function filterShoppingEntries(
	entries: ShoppingSessionHistoryEntry[],
	normalizedSearch: string,
	supermarketFilter: string,
): ShoppingSessionHistoryEntry[] {
	return entries.filter((entry) => {
		const matchesSupermarket =
			supermarketFilter === "all" ||
			entry.items.some((item) => item.supermarket === supermarketFilter);

		if (!matchesSupermarket) {
			return false;
		}

		if (normalizedSearch.length === 0) {
			return true;
		}

		return entry.items.some((item) =>
			item.productName.toLowerCase().includes(normalizedSearch),
		);
	});
}

export function getSupermarketOptions(
	entries: ShoppingSessionHistoryEntry[],
): string[] {
	return Array.from(
		new Set(
			entries.flatMap((entry) => entry.items.map((item) => item.supermarket)),
		),
	).sort((a, b) => a.localeCompare(b));
}
