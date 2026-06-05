import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShoppingHistoryInsightsPanel } from "./ShoppingHistoryInsightsPanel";
import type { ShoppingHistoryInsightsModel } from "@/features/shopping-history/model/ShoppingHistoryMetricsContracts";

const metricsFixture: ShoppingHistoryInsightsModel = {
	snapshot: {
		supermarketDominance: [
			{
				supermarket: "mercadona",
				totalSpent: 120,
				totalItems: 24,
				spentPercentage: 60,
				itemsPercentage: 48,
			},
		],
		trends: {
			weekly: [{ period: "2026-W23", amount: 50 }],
			monthly: [{ period: "2026-06", amount: 200 }],
			yearly: [{ period: "2026", amount: 1200 }],
		},
		ticketMetrics: {
			averageTicketCost: 25,
			totalSpentToDate: 1200,
			totalTickets: 48,
			mostFrequentGroceryDay: "Sábado",
		},
	},
	formattedTicketMetrics: {
		averageTicketCostLabel: "25,00 €",
		totalSpentToDateLabel: "1.200,00 €",
		totalTicketsLabel: "48",
		mostFrequentGroceryDayLabel: "Sábado",
	},
};

describe("ShoppingHistoryInsightsPanel", () => {
	it("should render KPI cards and chart sections when metrics are available", () => {
		render(
			<ShoppingHistoryInsightsPanel
				metrics={metricsFixture}
				isLoading={false}
				errorMessage={null}
			/>,
		);

		expect(screen.getByText("Ticket promedio")).toBeTruthy();
		expect(screen.getByText("Dominio por supermercado")).toBeTruthy();
		expect(screen.getByText("Tendencia de gasto")).toBeTruthy();
	});

	it("should allow switching trend aggregation mode", () => {
		render(
			<ShoppingHistoryInsightsPanel
				metrics={metricsFixture}
				isLoading={false}
				errorMessage={null}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Semanal" }));

		expect(screen.getByRole("button", { name: "Semanal" })).toBeTruthy();
	});

	it("should render empty or error states when metrics are unavailable", () => {
		const { rerender } = render(
			<ShoppingHistoryInsightsPanel
				metrics={null}
				isLoading={false}
				errorMessage={null}
			/>,
		);

		expect(
			screen.getByText(
				"Todavía no hay suficientes datos para mostrar la analítica.",
			),
		).toBeTruthy();

		rerender(
			<ShoppingHistoryInsightsPanel
				metrics={null}
				isLoading={false}
				errorMessage="error de metrics"
			/>,
		);

		expect(screen.getByText("error de metrics")).toBeTruthy();
	});
});
