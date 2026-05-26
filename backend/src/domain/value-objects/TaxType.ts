export type TaxTypeValue = "IGIC" | "IVA" | "UNKNOWN";

export class TaxType {
	private static readonly validValues = new Set<TaxTypeValue>([
		"IGIC",
		"IVA",
		"UNKNOWN",
	]);

	private constructor(public readonly value: TaxTypeValue) {
		Object.freeze(this);
	}

	static create(value: string): TaxType {
		if (!TaxType.isValid(value)) {
			throw new Error(`Invalid tax type: ${value}`);
		}

		return new TaxType(value);
	}

	private static isValid(value: string): value is TaxTypeValue {
		return TaxType.validValues.has(value as TaxTypeValue);
	}

	equals(other: TaxType): boolean {
		return this.value === other.value;
	}
}
