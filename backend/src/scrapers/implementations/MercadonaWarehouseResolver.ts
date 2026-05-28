import { logger } from "../../utils/logger";

export const DEFAULT_MERCADONA_WH_LAS_PALMAS = "3544";
const LAS_PALMAS_POSTAL_PREFIX = "35";

interface WarehouseResolverOptions {
	env?: Record<string, string | undefined>;
	warn?: (message: string) => void;
}

function isNumericString(value: string | undefined): value is string {
	return Boolean(value && /^\d+$/.test(value.trim()));
}

export function resolveMercadonaWarehouse(
	postalCode: string,
	options: WarehouseResolverOptions = {},
): string {
	const env = options.env ?? process.env;
	const warn = options.warn ?? ((message: string) => logger.warn(message));

	const isLasPalmas = postalCode.startsWith(LAS_PALMAS_POSTAL_PREFIX);
	if (!isLasPalmas) {
		return DEFAULT_MERCADONA_WH_LAS_PALMAS;
	}

	const configuredWh = env.MERCADONA_WH_LAS_PALMAS;
	if (isNumericString(configuredWh)) {
		return configuredWh.trim();
	}

	warn(
		"[MercadonaWarehouseResolver] Invalid or missing MERCADONA_WH_LAS_PALMAS. Falling back to 3544.",
	);
	return DEFAULT_MERCADONA_WH_LAS_PALMAS;
}
