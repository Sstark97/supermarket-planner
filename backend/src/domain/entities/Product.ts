import type { NormalizedUnit } from "../value-objects/NormalizedUnit";
import type { Price } from "../value-objects/Price";
import type { ProductCategory } from "../value-objects/ProductCategory";
import type { Supermarket } from "../value-objects/Supermarket";
import type { TaxType } from "../value-objects/TaxType";

export interface Product {
	readonly id: string;
	readonly sku: string;
	readonly name: string;
	readonly supermarket: Supermarket;
	readonly category: ProductCategory;
	readonly price: Price;
	readonly pricePerUnit: Price;
	readonly unit: NormalizedUnit;
	readonly taxType: TaxType;
	readonly scrapedAt: Date;
	readonly image?: string;
	readonly url?: string;
}
