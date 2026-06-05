import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetShoppingSessionMetricsUseCase } from "./GetShoppingSessionMetricsUseCase";
import type { ShoppingSessionRepository } from "@application/ports/outgoing/ShoppingSessionRepository";
import type { LoggerPort } from "@application/ports/outgoing/LoggerPort";
import type { ShoppingSession } from "@domain/entities/ShoppingSession";

function makeMockRepository(): ShoppingSessionRepository {
	return {
		save: vi.fn(async (session: ShoppingSession) => session),
		findByUserId: vi.fn(async () => []),
		deleteByIdForUser: vi.fn(async () => false),
		getMetricsForUser: vi.fn(async () => ({
			supermarketDominance: [
				{ supermarket: "mercadona", totalSpent: 120, totalItems: 42 },
			],
			spendingTrends: {
				weeklyAverage: [{ period: "2026-23", amount: 30 }],
				monthlyTotal: [{ period: "2026-06", amount: 420 }],
				yearlyTotal: [{ period: "2026", amount: 1800 }],
			},
			ticketMetrics: {
				averageTicketCost: 37.5,
				totalSpentToDate: 1800,
				mostFrequentGroceryDay: "Sábado",
				totalTickets: 48,
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

describe("GetShoppingSessionMetricsUseCase", () => {
	let repository: ShoppingSessionRepository;
	let logger: LoggerPort;
	let useCase: GetShoppingSessionMetricsUseCase;

	beforeEach(() => {
		repository = makeMockRepository();
		logger = makeMockLogger();
		useCase = new GetShoppingSessionMetricsUseCase(repository, logger);
	});

	it("should return shopping-session metrics for the authenticated user", async () => {
		const result = await useCase.execute({ userId: "user-1" });

		expect(repository.getMetricsForUser).toHaveBeenCalledWith("user-1");
		expect(result.supermarketDominance[0].supermarket).toBe("mercadona");
		expect(result.ticketMetrics.totalSpentToDate).toBe(1800);
	});

	it("should reject when user id is empty", async () => {
		await expect(useCase.execute({ userId: "  " })).rejects.toThrow(
			"User id is required to load shopping session metrics.",
		);
	});
});
