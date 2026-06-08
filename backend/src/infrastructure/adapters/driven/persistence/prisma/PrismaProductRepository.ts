import type {
	NormalizedNameCategoryUpdate,
	ProductCatalogFilters,
	ProductCatalogRepository,
} from "@application/ports/outgoing/ProductCatalogRepository";
import type { IProduct } from "@domain/entities/IProduct";
import { ProductNameNormalizer } from "@domain/services/ProductNameNormalizer";
import { PostalCode } from "@domain/value-objects/PostalCode";
import { logger } from "@infrastructure/logging/logger";
import {
	mapDomainProductToBaseUpsertPayload,
	mapDomainProductToPriceUpsertPayload,
	mapPrismaProductWithPriceToDomain,
	parsePrismaProductWithPriceRecord,
} from "./PrismaProductMapper";
import { prisma } from "./prisma";

export class PrismaProductRepository implements ProductCatalogRepository {
	async find(filters: ProductCatalogFilters): Promise<IProduct[]> {
		const normalizedQuery = filters.query?.trim();
		const requestedPostalCode = filters.postalCode ?? PostalCode.DEFAULT.value;
		const resolvedZoneId = await this.resolveZoneIdForRead(requestedPostalCode);
		if (!resolvedZoneId) {
			return [];
		}

		const rawRows = await prisma.product.findMany({
			where: {
				...(normalizedQuery
					? {
							name: {
								contains: normalizedQuery,
								mode: "insensitive",
							},
						}
					: {}),
				...(filters.category ? { category: filters.category } : {}),
				...(filters.supermarket ? { supermarket: filters.supermarket } : {}),
				prices: { some: { zoneId: resolvedZoneId } },
			},
			include: {
				prices: { where: { zoneId: resolvedZoneId } },
			},
			take: filters.limit ?? 500,
		});

		return this.parseAndCollectValidProducts(rawRows);
	}

	async save(products: IProduct[], postalCode: string): Promise<number> {
		const resolvedZoneId = await this.resolveZoneIdForWrite(postalCode);
		if (!resolvedZoneId) {
			logger.warn(
				`[PrismaProductRepository] Skipping save because postal code "${postalCode}" is not mapped to any pricing zone`,
			);
			return 0;
		}

		let savedProductsCount = 0;
		for (const product of products) {
			const savedProduct = await prisma.product.upsert(
				mapDomainProductToBaseUpsertPayload(product),
			);
			await prisma.productPrice.upsert(
				mapDomainProductToPriceUpsertPayload(
					product,
					savedProduct.id,
					resolvedZoneId,
				),
			);
			savedProductsCount += 1;
		}

		return savedProductsCount;
	}

	async findByCategory(category: string): Promise<IProduct[]> {
		const resolvedZoneId = await this.resolveZoneIdForRead(
			PostalCode.DEFAULT.value,
		);
		if (!resolvedZoneId) {
			return [];
		}

		const rawRows = await prisma.product.findMany({
			where: {
				category,
				prices: { some: { zoneId: resolvedZoneId } },
			},
			include: {
				prices: { where: { zoneId: resolvedZoneId } },
			},
		});

		return this.parseAndCollectValidProducts(rawRows);
	}

	private parseAndCollectValidProducts(rawRecords: unknown[]): IProduct[] {
		const validProducts: IProduct[] = [];
		for (const row of rawRecords) {
			const parsedRow = parsePrismaProductWithPriceRecord(row);
			if (!parsedRow.success) {
				logger.warn(
					`[PrismaProductRepository] Skipping invalid product row ${(row as { id?: string }).id ?? "unknown-id"}: ${parsedRow.error.issues.map((issue) => issue.message).join(", ")}`,
				);
				continue;
			}
			validProducts.push(mapPrismaProductWithPriceToDomain(parsedRow.data));
		}
		return validProducts;
	}

	async updateCategoryByNormalizedNames(
		updates: NormalizedNameCategoryUpdate[],
	): Promise<number> {
		if (updates.length === 0) {
			return 0;
		}

		let totalUpdated = 0;

		for (const update of updates) {
			const allProducts = await prisma.product.findMany({
				select: { id: true, name: true },
			});

			const matchingIds = allProducts
				.filter(
					(product) =>
						ProductNameNormalizer.normalize(product.name) ===
						update.normalizedName,
				)
				.map((product) => product.id);

			if (matchingIds.length === 0) {
				continue;
			}

			const result = await prisma.product.updateMany({
				where: { id: { in: matchingIds } },
				data: { category: update.category },
			});

			totalUpdated += result.count;
		}

		return totalUpdated;
	}

	private async resolveZoneIdForRead(
		postalCode: string,
	): Promise<string | null> {
		const mapping = await prisma.postalCode.findUnique({
			where: { code: postalCode },
			select: { zoneId: true },
		});
		if (!mapping) {
			return this.resolveMostPopulatedZoneInProvince(postalCode);
		}

		const pricesCountForMappedZone = await prisma.productPrice.count({
			where: { zoneId: mapping.zoneId },
		});
		if (pricesCountForMappedZone > 0) {
			return mapping.zoneId;
		}

		return this.resolveMostPopulatedZoneInProvince(postalCode);
	}

	private async resolveMostPopulatedZoneInProvince(
		postalCode: string,
	): Promise<string | null> {
		const provincePrefix = postalCode.slice(0, 2);
		if (provincePrefix.length !== 2) {
			return null;
		}

		const provinceZoneMappings = await prisma.postalCode.findMany({
			where: {
				code: {
					startsWith: provincePrefix,
				},
			},
			select: { zoneId: true },
			distinct: ["zoneId"],
		});
		const zoneIdsInProvince = provinceZoneMappings.map(
			(mapping) => mapping.zoneId,
		);
		if (zoneIdsInProvince.length === 0) {
			return null;
		}

		const groupedZoneCounts = await prisma.productPrice.groupBy({
			by: ["zoneId"],
			where: {
				zoneId: {
					in: zoneIdsInProvince,
				},
			},
			_count: {
				_all: true,
			},
			orderBy: {
				_count: {
					zoneId: "desc",
				},
			},
			take: 1,
		});

		const [mostPopulatedZone] = groupedZoneCounts;
		return mostPopulatedZone?.zoneId ?? null;
	}

	private async resolveZoneIdForWrite(
		postalCode: string,
	): Promise<string | null> {
		const existingMapping = await prisma.postalCode.findUnique({
			where: { code: postalCode },
			select: { zoneId: true },
		});
		return existingMapping?.zoneId ?? null;
	}
}
