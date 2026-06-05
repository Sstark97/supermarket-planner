import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShoppingHistoryKpiCards } from "./ShoppingHistoryKpiCards";

describe("ShoppingHistoryKpiCards", () => {
	it("should render the three KPI labels and values", () => {
		render(
			<ShoppingHistoryKpiCards
				formattedMetrics={{
					averageTicketCostLabel: "20,00 €",
					totalSpentToDateLabel: "400,00 €",
					totalTicketsLabel: "20",
					mostFrequentGroceryDayLabel: "Sábado",
				}}
			/>,
		);

		expect(screen.getByText("Ticket promedio")).toBeTruthy();
		expect(screen.getByText("Total gastado")).toBeTruthy();
		expect(screen.getByText("Día de compra más frecuente")).toBeTruthy();
		expect(screen.getByText("20,00 €")).toBeTruthy();
		expect(screen.getByText("400,00 €")).toBeTruthy();
		expect(screen.getByText("Sábado")).toBeTruthy();
	});
});
