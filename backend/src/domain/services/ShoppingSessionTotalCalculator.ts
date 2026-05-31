export class ShoppingSessionTotalCalculator {
	static calculate(
		items: ReadonlyArray<{ price: number; quantity: number }>,
	): number {
		const rawTotal = items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0,
		);
		return Math.round(rawTotal * 100) / 100;
	}
}
