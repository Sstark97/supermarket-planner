import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShoppingSessionGateway } from "@/lib/http/ShoppingSessionGateway";
import { ShoppingHistoryMetricsChartMapper } from "@/features/shopping-history/model/ShoppingHistoryMetricsChartMapper";
import { ShoppingHistoryMetricsFormatter } from "@/features/shopping-history/model/ShoppingHistoryMetricsFormatter";
import { ShoppingHistoryInsightsModelAssembler } from "@/features/shopping-history/model/ShoppingHistoryInsightsModelAssembler";
import { useShoppingHistoryMetrics } from "./useShoppingHistoryMetrics";

const mockGetAuthToken = vi.fn().mockResolvedValue("mock-token");
vi.mock("@/lib/auth/getAuthToken", () => ({
	getAuthToken: () => mockGetAuthToken(),
}));

function buildGatewayMock(): ShoppingSessionGateway {
	return {
		save: vi.fn(),
		list: vi.fn(),
		delete: vi.fn(),
		getMetrics: vi.fn(),
	};
}

describe("useShoppingHistoryMetrics", () => {
	const chartMapper = new ShoppingHistoryMetricsChartMapper();
	const formatter = new ShoppingHistoryMetricsFormatter();
	const modelAssembler = new ShoppingHistoryInsightsModelAssembler(
		chartMapper,
		formatter,
	);

	beforeEach(() => {
		mockGetAuthToken.mockReset();
		mockGetAuthToken.mockResolvedValue("mock-token");
	});

	it("should not fetch metrics before insights view is active", async () => {
		const gateway = buildGatewayMock();
		const getMetricsMock = vi.mocked(gateway.getMetrics);

		renderHook(() =>
			useShoppingHistoryMetrics("authenticated", false, {
				shoppingSessionGateway: gateway,
				modelAssembler,
			}),
		);

		await act(async () => {
			await Promise.resolve();
		});

		expect(getMetricsMock).not.toHaveBeenCalled();
	});

	it("should fetch and map metrics when insights view is active", async () => {
		const gateway = buildGatewayMock();
		const getMetricsMock = vi.mocked(gateway.getMetrics);
		getMetricsMock.mockResolvedValue({
			supermarketDominance: [
				{ supermarket: "mercadona", totalSpent: 50, totalItems: 10 },
				{ supermarket: "aldi", totalSpent: 50, totalItems: 10 },
			],
			spendingTrends: {
				weeklyAverage: [{ period: "2026-22", amount: 25 }],
				monthlyTotal: [{ period: "2026-06", amount: 100 }],
				yearlyTotal: [{ period: "2026", amount: 400 }],
			},
			ticketMetrics: {
				averageTicketCost: 20,
				totalSpentToDate: 400,
				totalTickets: 20,
				mostFrequentGroceryDay: "Sábado",
			},
		});

		const { result } = renderHook(() =>
			useShoppingHistoryMetrics("authenticated", true, {
				shoppingSessionGateway: gateway,
				modelAssembler,
			}),
		);

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(getMetricsMock).toHaveBeenCalledWith("mock-token");
		expect(
			result.current.metrics?.snapshot.supermarketDominance[0].spentPercentage,
		).toBe(50);
		expect(result.current.errorMessage).toBeNull();
	});

	it("should expose error state when gateway fails", async () => {
		const gateway = buildGatewayMock();
		const getMetricsMock = vi.mocked(gateway.getMetrics);
		getMetricsMock.mockRejectedValue(new Error("boom"));

		const { result } = renderHook(() =>
			useShoppingHistoryMetrics("authenticated", true, {
				shoppingSessionGateway: gateway,
				modelAssembler,
			}),
		);

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(result.current.metrics).toBeNull();
		expect(result.current.errorMessage).toBe(
			"No se pudieron cargar tus métricas de compra.",
		);
	});
});
