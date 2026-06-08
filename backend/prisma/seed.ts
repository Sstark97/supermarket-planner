import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

interface PostalCodeCsvRow {
	postalCode: string;
	municipalityId: string;
	municipalityName: string;
}

interface PricingZoneSeedRow {
	id: string;
	name: string;
}

interface PostalCodeSeedRow {
	code: string;
	zoneId: string;
}

const prisma = new PrismaClient();
const PRICING_ZONE_BATCH_SIZE = 1000;
const POSTAL_CODE_BATCH_SIZE = 3000;
const POSTAL_CODE_UPDATE_BATCH_SIZE = 1000;

const PROVINCE_NAME_BY_CODE: Record<string, string> = {
	"01": "alava",
	"02": "albacete",
	"03": "alicante",
	"04": "almeria",
	"05": "avila",
	"06": "badajoz",
	"07": "illes-balears",
	"08": "barcelona",
	"09": "burgos",
	"10": "caceres",
	"11": "cadiz",
	"12": "castellon",
	"13": "ciudad-real",
	"14": "cordoba",
	"15": "a-coruna",
	"16": "cuenca",
	"17": "girona",
	"18": "granada",
	"19": "guadalajara",
	"20": "gipuzkoa",
	"21": "huelva",
	"22": "huesca",
	"23": "jaen",
	"24": "leon",
	"25": "lleida",
	"26": "la-rioja",
	"27": "lugo",
	"28": "madrid",
	"29": "malaga",
	"30": "murcia",
	"31": "navarra",
	"32": "ourense",
	"33": "asturias",
	"34": "palencia",
	"35": "las-palmas",
	"36": "pontevedra",
	"37": "salamanca",
	"38": "santa-cruz-de-tenerife",
	"39": "cantabria",
	"40": "segovia",
	"41": "sevilla",
	"42": "soria",
	"43": "tarragona",
	"44": "teruel",
	"45": "toledo",
	"46": "valencia",
	"47": "valladolid",
	"48": "bizkaia",
	"49": "zamora",
	"50": "zaragoza",
	"51": "ceuta",
	"52": "melilla",
};

function splitIntoBatches<T>(records: T[], batchSize: number): T[][] {
	const batches: T[][] = [];
	for (
		let startIndex = 0;
		startIndex < records.length;
		startIndex += batchSize
	) {
		batches.push(records.slice(startIndex, startIndex + batchSize));
	}
	return batches;
}

function parseCsvLine(line: string): string[] {
	const values: string[] = [];
	let currentValue = "";
	let isInsideQuotes = false;

	for (
		let characterIndex = 0;
		characterIndex < line.length;
		characterIndex += 1
	) {
		const character = line[characterIndex];

		if (character === '"') {
			const nextCharacter = line[characterIndex + 1];
			if (isInsideQuotes && nextCharacter === '"') {
				currentValue += '"';
				characterIndex += 1;
				continue;
			}
			isInsideQuotes = !isInsideQuotes;
			continue;
		}

		if (character === "," && !isInsideQuotes) {
			values.push(currentValue.trim());
			currentValue = "";
			continue;
		}

		currentValue += character;
	}

	values.push(currentValue.trim());
	return values;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

function resolveProvinceSlug(municipalityId: string): string {
	const provinceCode = municipalityId.slice(0, 2);
	return PROVINCE_NAME_BY_CODE[provinceCode] ?? `provincia-${provinceCode}`;
}

function buildZoneId(municipalityName: string, municipalityId: string): string {
	const municipalitySlug = slugify(municipalityName);
	const provinceSlug = resolveProvinceSlug(municipalityId);
	return `zon-${municipalitySlug}-${provinceSlug}`;
}

async function loadPostalCodeCsvRows(): Promise<PostalCodeCsvRow[]> {
	const csvPath = path.resolve(
		process.cwd(),
		"codigos_postales_municipios.csv",
	);
	const csvContent = await readFile(csvPath, "utf8");
	const lines = csvContent
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length <= 1) {
		return [];
	}

	const dataLines = lines.slice(1);
	const parsedRows: PostalCodeCsvRow[] = [];

	for (const line of dataLines) {
		const [postalCode, municipalityId, municipalityName] = parseCsvLine(line);
		if (!postalCode || !municipalityId || !municipalityName) {
			continue;
		}

		parsedRows.push({
			postalCode,
			municipalityId,
			municipalityName,
		});
	}

	parsedRows.sort((leftRow, rightRow) => {
		if (leftRow.postalCode !== rightRow.postalCode) {
			return leftRow.postalCode.localeCompare(rightRow.postalCode);
		}
		return leftRow.municipalityId.localeCompare(rightRow.municipalityId);
	});

	return parsedRows;
}

function buildSeedRowsFromCsvRows(csvRows: PostalCodeCsvRow[]): {
	pricingZones: PricingZoneSeedRow[];
	postalCodes: PostalCodeSeedRow[];
	conflictingPostalCodeMappings: number;
} {
	const pricingZoneById = new Map<string, PricingZoneSeedRow>();
	const postalCodeToZoneId = new Map<string, string>();
	let conflictingPostalCodeMappings = 0;

	for (const csvRow of csvRows) {
		const baseZoneId = buildZoneId(
			csvRow.municipalityName,
			csvRow.municipalityId,
		);
		let finalZoneId = baseZoneId;
		const existingZone = pricingZoneById.get(baseZoneId);
		if (existingZone && existingZone.name !== csvRow.municipalityName) {
			finalZoneId = `${baseZoneId}-${csvRow.municipalityId}`;
		}

		if (!pricingZoneById.has(finalZoneId)) {
			pricingZoneById.set(finalZoneId, {
				id: finalZoneId,
				name: csvRow.municipalityName,
			});
		}

		const existingZoneId = postalCodeToZoneId.get(csvRow.postalCode);
		if (!existingZoneId) {
			postalCodeToZoneId.set(csvRow.postalCode, finalZoneId);
			continue;
		}

		if (existingZoneId !== finalZoneId) {
			conflictingPostalCodeMappings += 1;
		}
	}

	return {
		pricingZones: Array.from(pricingZoneById.values()),
		postalCodes: Array.from(postalCodeToZoneId.entries()).map(
			([code, zoneId]) => ({ code, zoneId }),
		),
		conflictingPostalCodeMappings,
	};
}

async function seedPricingZones(rows: PricingZoneSeedRow[]): Promise<void> {
	for (const batch of splitIntoBatches(rows, PRICING_ZONE_BATCH_SIZE)) {
		await prisma.pricingZone.createMany({
			data: batch,
			skipDuplicates: true,
		});
	}
}

async function seedPostalCodes(rows: PostalCodeSeedRow[]): Promise<void> {
	for (const batch of splitIntoBatches(rows, POSTAL_CODE_BATCH_SIZE)) {
		await prisma.postalCode.createMany({
			data: batch,
			skipDuplicates: true,
		});
	}

	for (const batch of splitIntoBatches(rows, POSTAL_CODE_UPDATE_BATCH_SIZE)) {
		await prisma.$transaction(
			batch.map((postalCodeRow) =>
				prisma.postalCode.update({
					where: { code: postalCodeRow.code },
					data: { zoneId: postalCodeRow.zoneId },
				}),
			),
		);
	}
}

async function migrateLegacyPostalZonesToNamedZones(): Promise<void> {
	await prisma.$executeRaw`
		INSERT INTO "ProductPrice" ("id", "productId", "zoneId", "price", "pricePerUnit", "scrapedAt")
		SELECT
			gen_random_uuid()::text,
			normalized_prices."productId",
			normalized_prices."zoneId",
			normalized_prices."price",
			normalized_prices."pricePerUnit",
			normalized_prices."scrapedAt"
		FROM (
			SELECT DISTINCT ON (prices."productId", postal_codes."zoneId")
				prices."productId",
				postal_codes."zoneId",
				prices."price",
				prices."pricePerUnit",
				prices."scrapedAt"
			FROM "ProductPrice" AS prices
			INNER JOIN "PostalCode" AS postal_codes
				ON postal_codes."code" = REPLACE(prices."zoneId", 'postal-', '')
			WHERE prices."zoneId" LIKE 'postal-%'
			ORDER BY prices."productId", postal_codes."zoneId", prices."scrapedAt" DESC
		) AS normalized_prices
		ON CONFLICT ("productId", "zoneId") DO UPDATE
		SET
			"price" = EXCLUDED."price",
			"pricePerUnit" = EXCLUDED."pricePerUnit",
			"scrapedAt" = GREATEST("ProductPrice"."scrapedAt", EXCLUDED."scrapedAt")
	`;

	await prisma.productPrice.deleteMany({
		where: { zoneId: { startsWith: "postal-" } },
	});

	await prisma.pricingZone.deleteMany({
		where: { id: { startsWith: "postal-" } },
	});
}

async function main(): Promise<void> {
	const csvRows = await loadPostalCodeCsvRows();
	const { pricingZones, postalCodes, conflictingPostalCodeMappings } =
		buildSeedRowsFromCsvRows(csvRows);

	await seedPricingZones(pricingZones);
	await seedPostalCodes(postalCodes);
	await migrateLegacyPostalZonesToNamedZones();

	console.log(
		`Seed completed from CSV. Zones: ${pricingZones.length}, postal codes: ${postalCodes.length}, conflicting mappings ignored: ${conflictingPostalCodeMappings}`,
	);
}

main()
	.catch((error) => {
		console.error(
			"Failed to seed pricing zones and postal codes from CSV",
			error,
		);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
