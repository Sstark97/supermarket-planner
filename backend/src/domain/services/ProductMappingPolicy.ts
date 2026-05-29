import { v4 as uuidv4 } from "uuid";
import type { IProduct } from "../entities/IProduct";
import {
	detectTaxType,
	normalizePricePerUnit,
} from "./PriceNormalizer";

export interface ProductMappingInput {
	supermarket: string;
	name: string;
	category: IProduct["category"];
	priceRaw: number | string;
	pricePerUnitRaw?: number | string;
	quantityRaw?: string;
	unitRaw?: string;
	image?: string;
	url?: string;
	taxHint?: string;
}

export interface ProductMapperConfig {
	createId?: () => string;
	nowIso?: () => string;
}

function toFiniteNumber(value: number | string | undefined): number {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : 0;
	}

	if (typeof value === "string") {
		const normalized = Number(value.replace(",", "."));
		return Number.isFinite(normalized) ? normalized : 0;
	}

	return 0;
}

export class ProductMapper {
	private readonly createId: () => string;
	private readonly nowIso: () => string;

	constructor(config: ProductMapperConfig = {}) {
		this.createId = config.createId ?? uuidv4;
		this.nowIso = config.nowIso ?? (() => new Date().toISOString());
	}

	toDomain(input: ProductMappingInput): IProduct {
		const safeName = input.name.trim() || `${input.supermarket} product`;
		const normalizedPrice = normalizePricePerUnit(
			String(input.priceRaw),
			input.quantityRaw ?? "1 ud",
		);
		const explicitPricePerUnit = toFiniteNumber(input.pricePerUnitRaw);

		return {
			id: this.createId(),
			name: safeName,
			supermarket: input.supermarket,
			category: input.category,
			price: toFiniteNumber(normalizedPrice.price),
			pricePerUnit:
				explicitPricePerUnit > 0
					? explicitPricePerUnit
					: toFiniteNumber(normalizedPrice.pricePerUnit),
			unit: input.unitRaw?.trim() || normalizedPrice.unit,
			image: input.image,
			url: input.url,
			taxType: detectTaxType(input.taxHint ?? safeName),
			scrapedAt: this.nowIso(),
		} satisfies IProduct;
	}
}

export const defaultProductMapper = new ProductMapper();
