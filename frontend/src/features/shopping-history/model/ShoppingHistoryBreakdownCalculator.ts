import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";

export interface SupermarketBreakdown {
	total: number;
	items: number;
}

export class ShoppingHistoryBreakdownCalculator {
	buildSupermarketBreakdown(
		entry: ShoppingSessionHistoryEntry,
	): Record<string, SupermarketBreakdown> {
		return entry.items.reduce<Record<string, SupermarketBreakdown>>(
			(accumulator, item) => {
				if (!accumulator[item.supermarket]) {
					accumulator[item.supermarket] = { total: 0, items: 0 };
				}

				accumulator[item.supermarket].total += item.price * item.quantity;
				accumulator[item.supermarket].items += item.quantity;

				return accumulator;
			},
			{},
		);
	}

	countPurchasedUnits(entry: ShoppingSessionHistoryEntry): number {
		return entry.items.reduce(
			(totalPurchasedUnits, item) => totalPurchasedUnits + item.quantity,
			0,
		);
	}
}
