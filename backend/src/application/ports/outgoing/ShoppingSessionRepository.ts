import type { ShoppingSession } from "@domain/entities/ShoppingSession";

export interface ShoppingSessionRepository {
	save(session: ShoppingSession): Promise<ShoppingSession>;
}
