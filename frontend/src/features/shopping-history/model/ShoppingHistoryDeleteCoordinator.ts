import type { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";

export class ShoppingHistoryDeleteCoordinator {
	constructor(private readonly shoppingSessionGateway: ShoppingSessionGateway) {}

	async deleteSession(sessionId: string, token: string): Promise<boolean> {
		if (sessionId.trim().length === 0) {
			throw new Error("sessionId is required.");
		}

		const result = await this.shoppingSessionGateway.delete(sessionId, token);
		return result.deleted;
	}
}
