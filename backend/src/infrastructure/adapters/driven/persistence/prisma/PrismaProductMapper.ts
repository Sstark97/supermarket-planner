import { z } from "zod";
import type { IProduct } from "@domain/entities/IProduct";
import { ProductCategory } from "@domain/entities/IProduct";
import { buildProductSku } from "@domain/services/ProductIdentity";

const productPriceRecordSchema = z.object({
	price: z.number(),
	pricePerUnit: z.number(),
	scrapedAt: z.date(),
});

const prismaProductWithPriceRecordSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	supermarket: z.string().min(1),
	category: z.nativeEnum(ProductCategory),
	unit: z.string().min(1),
	image: z.string().nullable(),
	url: z.string().nullable(),
	taxType: z.enum(["IGIC", "IVA", "UNKNOWN"]),
	prices: z.array(productPriceRecordSchema).min(1),
});

type PrismaProductWithPriceRecord = z.infer<
	typeof prismaProductWithPriceRecordSchema
>;

export interface ProductBaseUpsertPayload {
	where: { supermarket_sku: { supermarket: string; sku: string } };
	update: {
		name: string;
		category: string;
		unit: string;
		image: string | undefined;
		url: string | undefined;
		taxType: string;
	};
	create: {
		name: string;
		category: string;
		unit: string;
		image: string | undefined;
		url: string | undefined;
		taxType: string;
		supermarket: string;
		sku: string;
	};
}

export interface ProductPriceUpsertPayload {
	where: { productId_zoneId: { productId: string; zoneId: string } };
	update: { price: number; pricePerUnit: number; scrapedAt: Date };
	create: {
		price: number;
		pricePerUnit: number;
		scrapedAt: Date;
		zoneId: string;
		productId: string;
	};
}

export function parsePrismaProductWithPriceRecord(record: unknown) {
	return prismaProductWithPriceRecordSchema.safeParse(record);
}

export function mapPrismaProductWithPriceToDomain(
	record: PrismaProductWithPriceRecord,
): IProduct {
	const [priceForRequestedZone] = record.prices;

	return {
		id: record.id,
		name: record.name,
		supermarket: record.supermarket,
		category: record.category,
		price: priceForRequestedZone.price,
		pricePerUnit: priceForRequestedZone.pricePerUnit,
		unit: record.unit,
		image: record.image ?? undefined,
		url: record.url ?? undefined,
		taxType: record.taxType,
		scrapedAt: priceForRequestedZone.scrapedAt.toISOString(),
	};
}

export function mapDomainProductToBaseUpsertPayload(
	product: IProduct,
): ProductBaseUpsertPayload {
	const sku = buildProductSku(product);
	const persistedFields = {
		name: product.name,
		category: product.category,
		unit: product.unit,
		image: product.image,
		url: product.url,
		taxType: product.taxType,
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

export function mapDomainProductToPriceUpsertPayload(
	product: IProduct,
	productId: string,
	zoneId: string,
): ProductPriceUpsertPayload {
	const persistedFields = {
		price: product.price,
		pricePerUnit: product.pricePerUnit,
		scrapedAt: new Date(product.scrapedAt),
	};

	return {
		where: {
			productId_zoneId: {
				productId,
				zoneId,
			},
		},
		update: persistedFields,
		create: {
			...persistedFields,
			zoneId,
			productId,
		},
	};
}
