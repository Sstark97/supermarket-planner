export class Price {
	private constructor(public readonly value: number) {
		Object.freeze(this);
	}

	static create(value: number): Price {
		if (!Number.isFinite(value)) {
			throw new Error("Price must be a finite number");
		}

		if (value < 0) {
			throw new Error("Price cannot be negative");
		}

		return new Price(Number(value.toFixed(4)));
	}

	equals(other: Price): boolean {
		return this.value === other.value;
	}

	toNumber(): number {
		return this.value;
	}
}
