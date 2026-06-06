import type { ShoppingSession, ShoppingSessionItem } from "@domain/entities/ShoppingSession";
import type { Prisma, ShoppingSession as PrismaShoppingSession, ShoppingSessionItem as PrismaShoppingSessionItem } from "@prisma/client";

type PrismaShoppingSessionWithItems = PrismaShoppingSession & {
	items: PrismaShoppingSessionItem[];
};

export class PrismaShoppingSessionMapper {
	static toDomainEntity(record: PrismaShoppingSessionWithItems): ShoppingSession {
		return {
			id: record.id,
			userId: record.userId,
			shoppedAt: record.shoppedAt,
			totalPrice: record.totalPrice,
			createdAt: record.createdAt,
			items: record.items.map((item) =>
				PrismaShoppingSessionMapper.mapPrismaSessionItemToDomain(item),
			),
		};
	}

	static toCreatePayload(
		session: ShoppingSession,
	): Prisma.ShoppingSessionCreateInput {
		return {
			id: session.id,
			userId: session.userId,
			shoppedAt: session.shoppedAt,
			totalPrice: session.totalPrice,
			createdAt: session.createdAt,
			items: {
				create: session.items.map((item) => ({
					productName: item.productName,
					supermarket: item.supermarket,
					category: item.category,
					price: item.price,
					pricePerUnit: item.pricePerUnit,
					unit: item.unit,
					taxType: item.taxType,
					quantity: item.quantity,
					image: item.image,
					url: item.url,
				})),
			},
		};
	}

	private static mapPrismaSessionItemToDomain(
		item: PrismaShoppingSessionItem,
	): ShoppingSessionItem {
		return {
			productName: item.productName,
			supermarket: item.supermarket,
			category: item.category,
			price: item.price,
			pricePerUnit: item.pricePerUnit,
			unit: item.unit,
			taxType: item.taxType,
			quantity: item.quantity,
			image: item.image ?? undefined,
			url: item.url ?? undefined,
		};
	}
}
