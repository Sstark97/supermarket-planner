import type {
	ProductCatalogFilters,
	ProductCatalogRepository,
} from "../../../../../application/ports/outgoing/ProductCatalogRepository";
import type { IProduct } from "../../../../../domain/entities/IProduct";
import { prisma } from "./prisma";
import { logger } from "../../../../logging/logger";
import {
	mapDomainProductToPrismaUpsertPayload,
	mapPrismaProductRecordToDomain,
	parsePrismaProductRecord,
} from "./PrismaProductMapper";

export class PrismaProductRepository implements ProductCatalogRepository {
	async find(filters: ProductCatalogFilters): Promise<IProduct[]> {
		const normalizedQuery = filters.query?.trim();
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
			},
			take: filters.limit ?? 500,
		});

		const parsedProducts: IProduct[] = [];
		for (const row of rawRows) {
			const parsedRow = parsePrismaProductRecord(row);
			if (!parsedRow.success) {
				logger.warn(
					`[PrismaProductRepository] Skipping invalid product row ${(row as { id?: string }).id ?? "unknown-id"}: ${parsedRow.error.issues.map((issue) => issue.message).join(", ")}`,
				);
				continue;
			}

			parsedProducts.push(mapPrismaProductRecordToDomain(parsedRow.data));
		}

		return parsedProducts;
	}

	async save(products: IProduct[]): Promise<number> {
		let savedProductsCount = 0;
		for (const product of products) {
			await prisma.product.upsert(
				mapDomainProductToPrismaUpsertPayload(product),
			);
			savedProductsCount += 1;
		}

		return savedProductsCount;
	}
}
