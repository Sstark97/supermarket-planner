import type { ActiveCartRepository } from "@application/ports/outgoing/ActiveCartRepository";
import type { ActiveCart } from "@domain/entities/ActiveCart";
import { prisma } from "./prisma";
import { PrismaActiveCartMapper } from "./PrismaActiveCartMapper";

export class PrismaActiveCartRepository implements ActiveCartRepository {
	async findByUserId(userId: string): Promise<ActiveCart | null> {
		const record = await prisma.activeCart.findUnique({
			where: { userId },
			include: { items: true },
		});

		if (record === null) {
			return null;
		}

		return PrismaActiveCartMapper.toDomainEntity(record);
	}

	async upsert(cart: ActiveCart): Promise<ActiveCart> {
		const savedCart = await prisma.$transaction(async (tx) => {
			const upsertedCart = await tx.activeCart.upsert({
				where: { userId: cart.userId },
				create: {
					id: cart.id,
					userId: cart.userId,
				},
				update: {},
			});

			await tx.activeCartItem.deleteMany({
				where: { cartId: upsertedCart.id },
			});

			await tx.activeCartItem.createMany({
				data: cart.items.map((item) => ({
					cartId: upsertedCart.id,
					productId: item.productId,
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
			});

			return tx.activeCart.findUniqueOrThrow({
				where: { id: upsertedCart.id },
				include: { items: true },
			});
		});

		return PrismaActiveCartMapper.toDomainEntity(savedCart);
	}
}
