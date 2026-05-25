import { describe, expect, it } from "vitest";
import { normalizePricePerUnit, parsePrice } from "./PriceNormalizer";

describe("parsePrice", () => {
	it("parses complex supermarket price texts", () => {
		expect(parsePrice("0,99 EUR/l")).toBe(0.99);
		expect(parsePrice("1,50 €/kg")).toBe(1.5);
		expect(parsePrice("2.45 €/unidad")).toBe(2.45);
		expect(parsePrice("Before 3,00€ Now 1,99€")).toBe(1.99);
		expect(parsePrice("PVP 1.234,56 €")).toBe(1234.56);
	});
});

describe("normalizePricePerUnit", () => {
	const cases: Array<{
		label: string;
		priceRaw: string;
		quantityRaw: string;
		expectedPrice: number;
		expectedPricePerUnit: number;
		expectedUnit: "kg" | "L" | "ud";
	}> = [
		{
			label: "kg direct",
			priceRaw: "1,50 €/kg",
			quantityRaw: "kg",
			expectedPrice: 1.5,
			expectedPricePerUnit: 1.5,
			expectedUnit: "kg",
		},
		{
			label: "L direct",
			priceRaw: "0,99 EUR/l",
			quantityRaw: "l",
			expectedPrice: 0.99,
			expectedPricePerUnit: 0.99,
			expectedUnit: "L",
		},
		{
			label: "unidad direct",
			priceRaw: "2.45 €/unidad",
			quantityRaw: "unidad",
			expectedPrice: 2.45,
			expectedPricePerUnit: 2.45,
			expectedUnit: "ud",
		},
		{
			label: "price with old/new values",
			priceRaw: "Before 3,00€ Now 1,99€",
			quantityRaw: "1 ud",
			expectedPrice: 1.99,
			expectedPricePerUnit: 1.99,
			expectedUnit: "ud",
		},
		{
			label: "500 g to kg",
			priceRaw: "1,20€",
			quantityRaw: "500 g",
			expectedPrice: 1.2,
			expectedPricePerUnit: 2.4,
			expectedUnit: "kg",
		},
		{
			label: "250 gr to kg",
			priceRaw: "0,80€",
			quantityRaw: "250 gr",
			expectedPrice: 0.8,
			expectedPricePerUnit: 3.2,
			expectedUnit: "kg",
		},
		{
			label: "1500 ml to L",
			priceRaw: "2,70€",
			quantityRaw: "1500 ml",
			expectedPrice: 2.7,
			expectedPricePerUnit: 1.8,
			expectedUnit: "L",
		},
		{
			label: "75 cl to L",
			priceRaw: "3,00€",
			quantityRaw: "75 cl",
			expectedPrice: 3,
			expectedPricePerUnit: 4,
			expectedUnit: "L",
		},
		{
			label: "pack units",
			priceRaw: "3,60€",
			quantityRaw: "pack 6 ud",
			expectedPrice: 3.6,
			expectedPricePerUnit: 0.6,
			expectedUnit: "ud",
		},
		{
			label: "12 unidades",
			priceRaw: "6,00€",
			quantityRaw: "12 unidades",
			expectedPrice: 6,
			expectedPricePerUnit: 0.5,
			expectedUnit: "ud",
		},
		{
			label: "dot thousands + comma decimals",
			priceRaw: "PVP 1.234,56 €",
			quantityRaw: "2 kg",
			expectedPrice: 1234.56,
			expectedPricePerUnit: 617.28,
			expectedUnit: "kg",
		},
		{
			label: "comma thousands + dot decimals",
			priceRaw: "EUR 1,234.56",
			quantityRaw: "4 l",
			expectedPrice: 1234.56,
			expectedPricePerUnit: 308.64,
			expectedUnit: "L",
		},
		{
			label: "currency in quantity keeps unit",
			priceRaw: "1,75€",
			quantityRaw: "€/kg",
			expectedPrice: 1.75,
			expectedPricePerUnit: 1.75,
			expectedUnit: "kg",
		},
		{
			label: "eur slash litros",
			priceRaw: "2,10 eur",
			quantityRaw: "eur/litro",
			expectedPrice: 2.1,
			expectedPricePerUnit: 2.1,
			expectedUnit: "L",
		},
		{
			label: "fallback unknown quantity",
			priceRaw: "1,99€",
			quantityRaw: "formato especial",
			expectedPrice: 1.99,
			expectedPricePerUnit: 1.99,
			expectedUnit: "ud",
		},
		{
			label: "fallback ambiguous units",
			priceRaw: "2,50€",
			quantityRaw: "kg / l",
			expectedPrice: 2.5,
			expectedPricePerUnit: 2.5,
			expectedUnit: "ud",
		},
	];

	it("normalizes 16 supermarket format variations", () => {
		for (const testCase of cases) {
			const normalized = normalizePricePerUnit(
				testCase.priceRaw,
				testCase.quantityRaw,
			);

			expect(normalized.price).toBeCloseTo(testCase.expectedPrice, 6);
			expect(normalized.pricePerUnit).toBeCloseTo(
				testCase.expectedPricePerUnit,
				6,
			);
			expect(normalized.unit).toBe(testCase.expectedUnit);
		}
	});
});
