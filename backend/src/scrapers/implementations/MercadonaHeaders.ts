const REQUIRED_HEADERS = [
	"origin",
	"user-agent",
	"accept",
	"content-type",
	"referer",
	"accept-language",
] as const;

const BROWSER_UA_REGEX = /(mozilla\/5\.0).*(applewebkit|chrome|safari|edg)/i;

export class MercadonaHeaderValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MercadonaHeaderValidationError";
	}
}

export type MercadonaHeaders = Record<string, string>;

export function buildMercadonaHeaders(
	overrides: Partial<MercadonaHeaders> = {},
): MercadonaHeaders {
	return {
		Origin: "https://tienda.mercadona.es",
		"User-Agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
		Accept: "application/json, text/plain, */*",
		"Content-Type": "application/json",
		Referer: "https://tienda.mercadona.es/",
		"Accept-Language": "es-ES,es;q=0.9",
		"Sec-Fetch-Site": "same-site",
		"Sec-Fetch-Mode": "cors",
		"Sec-Fetch-Dest": "empty",
		...overrides,
	};
}

function toLowerCaseKeyMap(headers: MercadonaHeaders): Record<string, string> {
	return Object.entries(headers).reduce<Record<string, string>>(
		(acc, [key, value]) => {
			acc[key.toLowerCase()] = value;
			return acc;
		},
		{},
	);
}

export function validateMercadonaHeaders(headers: MercadonaHeaders): void {
	const normalized = toLowerCaseKeyMap(headers);

	for (const header of REQUIRED_HEADERS) {
		const value = normalized[header];
		if (!value || !value.trim()) {
			throw new MercadonaHeaderValidationError(
				`Missing mandatory Mercadona header: ${header}`,
			);
		}
	}

	if (normalized.origin !== "https://tienda.mercadona.es") {
		throw new MercadonaHeaderValidationError(
			"Origin must be https://tienda.mercadona.es",
		);
	}

	if (!BROWSER_UA_REGEX.test(normalized["user-agent"])) {
		throw new MercadonaHeaderValidationError(
			"User-Agent must look like a modern browser",
		);
	}
}
