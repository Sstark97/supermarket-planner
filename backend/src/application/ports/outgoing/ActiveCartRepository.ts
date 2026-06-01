import type { ActiveCart } from "@domain/entities/ActiveCart";

export interface ActiveCartRepository {
	findByUserId(userId: string): Promise<ActiveCart | null>;
	upsert(cart: ActiveCart): Promise<ActiveCart>;
}
