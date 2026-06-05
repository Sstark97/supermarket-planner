import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";

export class ShoppingHistoryEntryFilter {
	filterBySearchAndSupermarket(
		entries: ShoppingSessionHistoryEntry[],
		searchTerm: string,
		supermarketFilter: string,
	): ShoppingSessionHistoryEntry[] {
		const normalizedSearchTerm = searchTerm.trim().toLowerCase();

		return entries.filter((entry) => {
			const matchesSupermarket =
				supermarketFilter === "all" ||
				entry.items.some((item) => item.supermarket === supermarketFilter);

			if (!matchesSupermarket) {
				return false;
			}

			if (normalizedSearchTerm.length === 0) {
				return true;
			}

			return entry.items.some((item) =>
				item.productName.toLowerCase().includes(normalizedSearchTerm),
			);
		});
	}

	collectSupermarketOptions(entries: ShoppingSessionHistoryEntry[]): string[] {
		return Array.from(
			new Set(
				entries.flatMap((entry) => entry.items.map((item) => item.supermarket)),
			),
		).sort((leftSupermarket, rightSupermarket) =>
			leftSupermarket.localeCompare(rightSupermarket),
		);
	}
}
