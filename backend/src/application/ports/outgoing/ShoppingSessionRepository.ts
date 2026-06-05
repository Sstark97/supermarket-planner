import type { ShoppingSession } from "@domain/entities/ShoppingSession";

export interface ShoppingSessionRepository {
	save(session: ShoppingSession): Promise<ShoppingSession>;
	findByUserId(userId: string): Promise<ShoppingSession[]>;
	deleteByIdForUser(sessionId: string, userId: string): Promise<boolean>;
}
