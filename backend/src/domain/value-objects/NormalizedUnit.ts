export type NormalizedUnitValue = "kg" | "L" | "ud";

export class NormalizedUnit {
	private static readonly validValues = new Set<NormalizedUnitValue>([
		"kg",
		"L",
		"ud",
	]);

	private constructor(public readonly value: NormalizedUnitValue) {
		Object.freeze(this);
	}

	static create(value: string): NormalizedUnit {
		if (!NormalizedUnit.isValid(value)) {
			throw new Error(`Invalid normalized unit: ${value}`);
		}

		return new NormalizedUnit(value);
	}

	private static isValid(value: string): value is NormalizedUnitValue {
		return NormalizedUnit.validValues.has(value as NormalizedUnitValue);
	}

	equals(other: NormalizedUnit): boolean {
		return this.value === other.value;
	}
}
