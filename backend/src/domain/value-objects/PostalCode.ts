const SPANISH_POSTAL_CODE_PATTERN = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

export class PostalCode {
	static readonly DEFAULT = PostalCode.create("35001");

	private constructor(public readonly value: string) {
		Object.freeze(this);
	}

	static create(value: string): PostalCode {
		if (!SPANISH_POSTAL_CODE_PATTERN.test(value)) {
			throw new Error(`Invalid Spanish postal code: "${value}"`);
		}

		return new PostalCode(value);
	}

	equals(other: PostalCode): boolean {
		return this.value === other.value;
	}

	toString(): string {
		return this.value;
	}
}
