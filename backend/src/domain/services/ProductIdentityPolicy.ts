import type { NormalizedUnit } from "../value-objects/NormalizedUnit";
import type { Supermarket } from "../value-objects/Supermarket";

export interface ProductIdentityInput {
	name: string;
	supermarket: Supermarket;
	unit: NormalizedUnit;
}

export interface ProductIdentityPolicy {
	buildSku(input: ProductIdentityInput): string;
}
