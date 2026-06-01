import type { ActiveCartItem } from "@domain/entities/ActiveCart";

export class ActiveCartMerger {
	static merge(
		existingItems: readonly ActiveCartItem[],
		incomingItems: readonly ActiveCartItem[],
	): ActiveCartItem[] {
		const resultMap = new Map<string, ActiveCartItem>();

		for (const item of existingItems) {
			const key = ActiveCartMerger.compositeKey(item);
			resultMap.set(key, { ...item });
		}

		for (const item of incomingItems) {
			const key = ActiveCartMerger.compositeKey(item);
			resultMap.set(key, { ...item });
		}

		return Array.from(resultMap.values());
	}

	private static compositeKey(item: ActiveCartItem): string {
		return `${item.supermarket}:${item.productName}`;
	}
}
