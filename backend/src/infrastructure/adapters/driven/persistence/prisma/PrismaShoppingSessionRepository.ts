import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";
import { prisma } from "./prisma";
import { PrismaShoppingSessionMapper } from "./PrismaShoppingSessionMapper";

export class PrismaShoppingSessionRepository implements ShoppingSessionRepository {
	async save(session: ShoppingSession): Promise<ShoppingSession> {
		const createPayload = PrismaShoppingSessionMapper.toCreatePayload(session);

		const savedRecord = await prisma.shoppingSession.create({
			data: createPayload,
			include: { items: true },
		});

		return PrismaShoppingSessionMapper.toDomainEntity(savedRecord);
	}
}
