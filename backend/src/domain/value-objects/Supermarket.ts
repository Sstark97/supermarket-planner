export type SupermarketValue =
	| "hiperdino"
	| "mercadona"
	| "carrefour"
	| "lidl"
	| "aldi";

export class Supermarket {
	private static readonly validValues = new Set<SupermarketValue>([
		"hiperdino",
		"mercadona",
		"carrefour",
		"lidl",
		"aldi",
	]);

	private constructor(public readonly value: SupermarketValue) {
		Object.freeze(this);
	}

	static create(value: string): Supermarket {
		if (!Supermarket.isValid(value)) {
			throw new Error(`Invalid supermarket: ${value}`);
		}

		return new Supermarket(value);
	}

	private static isValid(value: string): value is SupermarketValue {
		return Supermarket.validValues.has(value as SupermarketValue);
	}

	equals(other: Supermarket): boolean {
		return this.value === other.value;
	}
}
