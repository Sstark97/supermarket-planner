export type ProductCategoryValue =
	| "dairy"
	| "meat"
	| "fish"
	| "fruits_veg"
	| "bakery"
	| "drinks"
	| "frozen"
	| "cleaning"
	| "personal_care"
	| "snacks"
	| "canned_goods"
	| "condiments"
	| "cereals_pasta"
	| "baby"
	| "pet"
	| "other";

export class ProductCategory {
	private static readonly validValues = new Set<ProductCategoryValue>([
		"dairy",
		"meat",
		"fish",
		"fruits_veg",
		"bakery",
		"drinks",
		"frozen",
		"cleaning",
		"personal_care",
		"snacks",
		"canned_goods",
		"condiments",
		"cereals_pasta",
		"baby",
		"pet",
		"other",
	]);

	private constructor(public readonly value: ProductCategoryValue) {
		Object.freeze(this);
	}

	static create(value: string): ProductCategory {
		if (!ProductCategory.isValid(value)) {
			throw new Error(`Invalid product category: ${value}`);
		}

		return new ProductCategory(value);
	}

	private static isValid(value: string): value is ProductCategoryValue {
		return ProductCategory.validValues.has(value as ProductCategoryValue);
	}

	equals(other: ProductCategory): boolean {
		return this.value === other.value;
	}
}
