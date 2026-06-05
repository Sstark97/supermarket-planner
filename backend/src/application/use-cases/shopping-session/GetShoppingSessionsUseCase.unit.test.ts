import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetShoppingSessionsUseCase } from "./GetShoppingSessionsUseCase";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";

function makeMockRepository(): ShoppingSessionRepository {
	return {
		save: vi.fn(async (session: ShoppingSession) => session),
		findByUserId: vi.fn(async () => [
			{
				id: "session-1",
				userId: "user-1",
				shoppedAt: new Date("2026-06-01T10:00:00.000Z"),
				totalPrice: 12.5,
				createdAt: new Date("2026-06-01T10:05:00.000Z"),
				items: [
					{
						productName: "Pan",
						supermarket: "lidl",
						category: "bakery",
						price: 1.25,
						pricePerUnit: 1.25,
						unit: "ud",
						taxType: "IGIC",
						quantity: 2,
					},
				],
			},
		]),
		deleteByIdForUser: vi.fn(async () => false),
		getMetricsForUser: vi.fn(async () => ({
			supermarketDominance: [],
			spendingTrends: {
				weeklyAverage: [],
				monthlyTotal: [],
				yearlyTotal: [],
			},
			ticketMetrics: {
				averageTicketCost: 0,
				totalSpentToDate: 0,
				mostFrequentGroceryDay: null,
				totalTickets: 0,
			},
		})),
	};
}

function makeMockLogger(): LoggerPort {
	return {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};
}

describe("GetShoppingSessionsUseCase", () => {
	let repository: ShoppingSessionRepository;
	let logger: LoggerPort;
	let useCase: GetShoppingSessionsUseCase;

	beforeEach(() => {
		repository = makeMockRepository();
		logger = makeMockLogger();
		useCase = new GetShoppingSessionsUseCase(repository, logger);
	});

	it("should return serialized shopping sessions for a user", async () => {
		const result = await useCase.execute({ userId: "user-1" });

		expect(repository.findByUserId).toHaveBeenCalledWith("user-1");
		expect(result.sessions).toHaveLength(1);
		expect(result.sessions[0].sessionId).toBe("session-1");
		expect(result.sessions[0].shoppedAt).toBe("2026-06-01T10:00:00.000Z");
		expect(result.sessions[0].items[0].productName).toBe("Pan");
	});
});
