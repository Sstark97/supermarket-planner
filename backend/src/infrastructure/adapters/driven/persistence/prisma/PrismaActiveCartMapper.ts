import type {
	ActiveCart as PrismaActiveCart,
	ActiveCartItem as PrismaActiveCartItem,
} from "@prisma/client";
import type { ActiveCart, ActiveCartItem } from "@domain/entities/ActiveCart";

type PrismaActiveCartWithItems = PrismaActiveCart & {
	items: PrismaActiveCartItem[];
};

export class PrismaActiveCartMapper {
	static toDomainEntity(record: PrismaActiveCartWithItems): ActiveCart {
		return {
			id: record.id,
			userId: record.userId,
			updatedAt: record.updatedAt,
			items: record.items.map((item) =>
				PrismaActiveCartMapper.mapPrismaCartItemToDomain(item),
			),
		};
	}

	private static mapPrismaCartItemToDomain(item: PrismaActiveCartItem): ActiveCartItem {
		return {
			productId: item.productId,
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
