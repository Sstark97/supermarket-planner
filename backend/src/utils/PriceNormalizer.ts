/**
 * PriceNormalizer — parses price strings from various supermarket formats
 * and normalizes them to a price per unit (kg, L, or ud).
 */

export interface ParsedPrice {
    price: number;
    pricePerUnit: number;
    unit: string;
}

const UNIT_WEIGHT_MAP: Record<string, number> = {
    kg: 1,
    g: 0.001,
    l: 1,
    ml: 0.001,
    cl: 0.01,
};

/**
 * Extracts the numeric price from a string like "1,29 €", "1.29€", "€1.29"
 */
export function parsePrice(raw: string): number {
    const cleaned = raw
        .replace(/[€$£\s]/g, '')
        .replace(',', '.');
    const match = cleaned.match(/[\d.]+/);
    if (!match) return 0;
    return parseFloat(match[0]);
}

/**
 * Parses a price string and quantity/unit string to compute pricePerUnit.
 * Examples:
 *   "1,29 €", "1 kg"     → { price: 1.29, pricePerUnit: 1.29, unit: 'kg' }
 *   "2,35 €", "250 g"    → { price: 2.35, pricePerUnit: 9.40, unit: 'kg' }
 *   "3,99 €", "6 ud"     → { price: 3.99, pricePerUnit: 0.665, unit: 'ud' }
 *   "0,35 €", "1.5 L"    → { price: 0.35, pricePerUnit: 0.233, unit: 'L' }
 */
export function normalizePricePerUnit(priceRaw: string, quantityRaw: string): ParsedPrice {
    const price = parsePrice(priceRaw);
    const quantity = quantityRaw.toLowerCase().trim();

    // Match patterns like "1.5 kg", "250g", "500 ml", "6 ud", "12 uds"
    const match = quantity.match(/^([\d.,]+)\s*(kg|g|l|ml|cl|ud|uds|u|unidad|unidades)?$/i);

    if (!match) {
        return { price, pricePerUnit: price, unit: 'ud' };
    }

    const amount = parseFloat(match[1].replace(',', '.'));
    const unitRaw = (match[2] ?? 'ud').toLowerCase();

    // Normalize unit labels
    const unitNorm = unitRaw.startsWith('ud') || unitRaw === 'u' || unitRaw.startsWith('unidad')
        ? 'ud'
        : unitRaw;

    if (unitNorm === 'ud') {
        return { price, pricePerUnit: amount > 1 ? price / amount : price, unit: 'ud' };
    }

    const factor = UNIT_WEIGHT_MAP[unitNorm] ?? 1;
    const amountInBaseUnit = amount * factor; // convert to kg or L
    const baseUnit = unitNorm === 'l' || unitNorm === 'ml' || unitNorm === 'cl' ? 'L' : 'kg';
    const pricePerUnit = amountInBaseUnit > 0 ? price / amountInBaseUnit : price;

    return { price, pricePerUnit: Math.round(pricePerUnit * 1000) / 1000, unit: baseUnit };
}

/**
 * Detects if a product text mentions IGIC (Canarian tax) or IVA (peninsular VAT).
 */
export function detectTaxType(text: string): 'IGIC' | 'IVA' | 'UNKNOWN' {
    const upper = text.toUpperCase();
    if (upper.includes('IGIC')) return 'IGIC';
    if (upper.includes('IVA')) return 'IVA';
    return 'UNKNOWN';
}
