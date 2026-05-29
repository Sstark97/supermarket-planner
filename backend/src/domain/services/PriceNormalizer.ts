/**
 * PriceNormalizer — parses price strings from various supermarket formats
 * and normalizes them to a price per unit (kg, L, or ud).
 */

export interface ParsedPrice {
	price: number;
	pricePerUnit: number;
	unit: string;
}

type UnitGroup = "weight" | "volume" | "unit";

interface UnitDefinition {
	normalizedUnit: "kg" | "L" | "ud";
	group: UnitGroup;
	factorToBase: number;
}

const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
	kg: { normalizedUnit: "kg", group: "weight", factorToBase: 1 },
	kilo: { normalizedUnit: "kg", group: "weight", factorToBase: 1 },
	kilos: { normalizedUnit: "kg", group: "weight", factorToBase: 1 },
	g: { normalizedUnit: "kg", group: "weight", factorToBase: 0.001 },
	gr: { normalizedUnit: "kg", group: "weight", factorToBase: 0.001 },
	gramo: { normalizedUnit: "kg", group: "weight", factorToBase: 0.001 },
	gramos: { normalizedUnit: "kg", group: "weight", factorToBase: 0.001 },
	l: { normalizedUnit: "L", group: "volume", factorToBase: 1 },
	lt: { normalizedUnit: "L", group: "volume", factorToBase: 1 },
	litro: { normalizedUnit: "L", group: "volume", factorToBase: 1 },
	litros: { normalizedUnit: "L", group: "volume", factorToBase: 1 },
	ml: { normalizedUnit: "L", group: "volume", factorToBase: 0.001 },
	cl: { normalizedUnit: "L", group: "volume", factorToBase: 0.01 },
	ud: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
	uds: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
	u: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
	unidad: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
	unidades: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
	unid: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
	pack: { normalizedUnit: "ud", group: "unit", factorToBase: 1 },
};

const UNIT_PATTERN =
	/\b(kg|kilos?|gr(?:amos?)?|g|l|lt|litros?|ml|cl|uds?|u|unid(?:ad(?:es)?)?|pack)\b/gi;

function sanitizeRawText(raw: string): string {
	return raw
		.toLowerCase()
		.replace(/[\u00a0\u202f]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function normalizeNumericToken(rawNumber: string): number {
	const compact = rawNumber.replace(/\s/g, "");
	if (!compact) return 0;

	const hasComma = compact.includes(",");
	const hasDot = compact.includes(".");

	if (hasComma && hasDot) {
		const lastComma = compact.lastIndexOf(",");
		const lastDot = compact.lastIndexOf(".");
		const decimalSeparator = lastComma > lastDot ? "," : ".";
		const thousandSeparator = decimalSeparator === "," ? "." : ",";

		const normalized = compact
			.split(thousandSeparator)
			.join("")
			.replace(decimalSeparator, ".");

		return Number.parseFloat(normalized) || 0;
	}

	if (hasComma) {
		return Number.parseFloat(compact.replace(/\./g, "").replace(",", ".")) || 0;
	}

	return Number.parseFloat(compact.replace(/,/g, "")) || 0;
}

/**
 * Extracts the numeric price from strings like:
 * - "1,29 €"
 * - "0,99 EUR/l"
 * - "Before 3,00€ Now 1,99€"
 */
export function parsePrice(raw: string): number {
	const text = sanitizeRawText(raw);

	// Prefer values explicitly tied to currency symbols/words.
	const currencyCandidates: string[] = [];
	const currencyRegex =
		/(\d[\d.,\s]*)\s*(?:€|eur\b)|(?:€|eur\b)\s*(\d[\d.,\s]*)/gi;
	for (const match of text.matchAll(currencyRegex)) {
		const candidate = (match[1] || match[2] || "").trim();
		if (candidate) currencyCandidates.push(candidate);
	}

	if (currencyCandidates.length > 0) {
		return normalizeNumericToken(
			currencyCandidates[currencyCandidates.length - 1],
		);
	}

	// Fallback: last numeric token in the string.
	const numericCandidates = [...text.matchAll(/\d[\d.,\s]*/g)].map((m) =>
		m[0].trim(),
	);
	if (numericCandidates.length === 0) return 0;

	return normalizeNumericToken(numericCandidates[numericCandidates.length - 1]);
}

function extractAmountAndUnit(
	quantityRaw: string,
): { amount: number; unit: "kg" | "L" | "ud" } | null {
	const quantity = sanitizeRawText(quantityRaw)
		.replace(/(?:€|eur)\s*\/?\s*/g, "")
		.replace(/\bpor\b/g, " ");

	const amountAndUnitRegex =
		/(\d[\d.,\s]*)\s*(kg|kilos?|gr(?:amos?)?|g|l|lt|litros?|ml|cl|uds?|u|unid(?:ad(?:es)?)?|pack)\b/i;
	const amountAndUnitMatch = quantity.match(amountAndUnitRegex);
	if (amountAndUnitMatch) {
		const amount = normalizeNumericToken(amountAndUnitMatch[1]);
		const rawUnit = amountAndUnitMatch[2].toLowerCase();
		const def = UNIT_DEFINITIONS[rawUnit];
		if (!def || amount <= 0) return null;
		return { amount: amount * def.factorToBase, unit: def.normalizedUnit };
	}

	// Supports unit-only formats like "€/kg", "eur/l", "/unidad".
	const standaloneUnits = [...quantity.matchAll(UNIT_PATTERN)].map((match) =>
		match[1].toLowerCase(),
	);
	const uniqueUnits = Array.from(new Set(standaloneUnits));
	if (uniqueUnits.length === 1) {
		const def = UNIT_DEFINITIONS[uniqueUnits[0]];
		if (!def) return null;
		return { amount: 1, unit: def.normalizedUnit };
	}

	return null;
}

/**
 * Parses a price string and quantity/unit string to compute pricePerUnit.
 */
export function normalizePricePerUnit(
	priceRaw: string,
	quantityRaw: string,
): ParsedPrice {
	const price = parsePrice(priceRaw);
	const parsedUnit = extractAmountAndUnit(quantityRaw);

	if (!parsedUnit) {
		return { price, pricePerUnit: price, unit: "ud" };
	}

	const { amount, unit } = parsedUnit;
	if (amount <= 0) {
		return { price, pricePerUnit: price, unit: "ud" };
	}

	if (unit === "ud") {
		return {
			price,
			pricePerUnit: amount > 1 ? price / amount : price,
			unit,
		};
	}

	return {
		price,
		pricePerUnit: price / amount,
		unit,
	};
}

/**
 * Detects if a product text mentions IGIC (Canarian tax) or IVA (peninsular VAT).
 */
export function detectTaxType(text: string): "IGIC" | "IVA" | "UNKNOWN" {
	const upper = text.toUpperCase();
	if (upper.includes("IGIC")) return "IGIC";
	if (upper.includes("IVA")) return "IVA";
	return "UNKNOWN";
}
