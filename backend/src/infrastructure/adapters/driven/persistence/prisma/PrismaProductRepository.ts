import type {
	ProductCatalogFilters,
	ProductCatalogRepository,
	NormalizedNameCategoryUpdate,
} from "@application/ports/outgoing/ProductCatalogRepository";
import type { IProduct } from "@domain/entities/IProduct";
import { PostalCode } from "@domain/value-objects/PostalCode";
import { ProductNameNormalizer } from "@domain/services/ProductNameNormalizer";
import { prisma } from "./prisma";
import { logger } from "@infrastructure/logging/logger";
import {
	mapDomainProductToBaseUpsertPayload,
	mapDomainProductToPriceUpsertPayload,
	mapPrismaProductWithPriceToDomain,
	parsePrismaProductWithPriceRecord,
} from "./PrismaProductMapper";

export class PrismaProductRepository implements ProductCatalogRepository {
	async find(filters: ProductCatalogFilters): Promise<IProduct[]> {
		const normalizedQuery = filters.query?.trim();
		const postalCode = filters.postalCode ?? PostalCode.DEFAULT.value;
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
				prices: { some: { postalCode } },
			},
			include: {
				prices: { where: { postalCode } },
			},
			take: filters.limit ?? 500,
		});

		return this.parseAndCollectValidProducts(rawRows);
	}

	async save(products: IProduct[], postalCode: string): Promise<number> {
		let savedProductsCount = 0;
		for (const product of products) {
			const savedProduct = await prisma.product.upsert(
				mapDomainProductToBaseUpsertPayload(product),
			);
			await prisma.productPrice.upsert(
				mapDomainProductToPriceUpsertPayload(product, savedProduct.id, postalCode),
			);
			savedProductsCount += 1;
		}

		return savedProductsCount;
	}

	async findByCategory(category: string): Promise<IProduct[]> {
		const postalCode = PostalCode.DEFAULT.value;
		const rawRows = await prisma.product.findMany({
			where: {
				category,
				prices: { some: { postalCode } },
			},
			include: {
				prices: { where: { postalCode } },
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
					(p) => ProductNameNormalizer.normalize(p.name) === update.normalizedName,
				)
				.map((p) => p.id);

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
}
