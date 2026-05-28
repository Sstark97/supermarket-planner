import { z } from "zod";
import type { IProduct } from "../../../../../interfaces/IProduct";
import { ProductCategory } from "../../../../../interfaces/IProduct";
import { buildProductSku } from "../../../../../utils/ProductIdentity";

const prismaProductRecordSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	supermarket: z.string().min(1),
	category: z.nativeEnum(ProductCategory),
	price: z.number(),
	pricePerUnit: z.number(),
	unit: z.string().min(1),
	image: z.string().nullable(),
	url: z.string().nullable(),
	taxType: z.enum(["IGIC", "IVA", "UNKNOWN"]),
	scrapedAt: z.date(),
});

type PrismaProductRecord = z.infer<typeof prismaProductRecordSchema>;

export function parsePrismaProductRecord(record: unknown) {
	return prismaProductRecordSchema.safeParse(record);
}

export function mapPrismaProductRecordToDomain(
	record: PrismaProductRecord,
): IProduct {
	return {
		id: record.id,
		name: record.name,
		supermarket: record.supermarket,
		category: record.category,
		price: record.price,
		pricePerUnit: record.pricePerUnit,
		unit: record.unit,
		image: record.image ?? undefined,
		url: record.url ?? undefined,
		taxType: record.taxType,
		scrapedAt: record.scrapedAt.toISOString(),
	};
}

export function mapDomainProductToPrismaUpsertPayload(product: IProduct) {
	const sku = buildProductSku(product);
	const persistedFields = {
		name: product.name,
		category: product.category,
		price: product.price,
		pricePerUnit: product.pricePerUnit,
		unit: product.unit,
		image: product.image,
		url: product.url,
		taxType: product.taxType,
		scrapedAt: new Date(product.scrapedAt),
	};

	return {
		where: {
			supermarket_sku: {
				supermarket: product.supermarket,
				sku,
			},
		},
		update: persistedFields,
		create: {
			...persistedFields,
			supermarket: product.supermarket,
			sku,
		},
	};
}
