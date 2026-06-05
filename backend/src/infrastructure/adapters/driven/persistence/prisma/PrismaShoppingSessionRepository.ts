import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";
import { prisma } from "./prisma";
import { PrismaShoppingSessionMapper } from "./PrismaShoppingSessionMapper";

export class PrismaShoppingSessionRepository
	implements ShoppingSessionRepository
{
	async save(session: ShoppingSession): Promise<ShoppingSession> {
		const createPayload = PrismaShoppingSessionMapper.toCreatePayload(session);

		const savedRecord = await prisma.shoppingSession.create({
			data: createPayload,
			include: { items: true },
		});

		return PrismaShoppingSessionMapper.toDomainEntity(savedRecord);
	}

	async findByUserId(userId: string): Promise<ShoppingSession[]> {
		const records = await prisma.shoppingSession.findMany({
			where: { userId },
			orderBy: [{ shoppedAt: "desc" }, { createdAt: "desc" }],
			include: { items: true },
		});

		return records.map((record) =>
			PrismaShoppingSessionMapper.toDomainEntity(record),
		);
	}

	async deleteByIdForUser(sessionId: string, userId: string): Promise<boolean> {
		const result = await prisma.shoppingSession.deleteMany({
			where: {
				id: sessionId,
				userId,
			},
		});

		return result.count > 0;
	}
}
