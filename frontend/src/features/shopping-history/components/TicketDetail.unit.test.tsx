import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TicketDetail } from "./TicketDetail";
import { ShoppingHistoryDateFormatter } from "@/features/shopping-history/model/ShoppingHistoryDateFormatter";
import { ShoppingHistoryBreakdownCalculator } from "@/features/shopping-history/model/ShoppingHistoryBreakdownCalculator";

const dateFormatter = new ShoppingHistoryDateFormatter();
const breakdownCalculator = new ShoppingHistoryBreakdownCalculator();

const entry = {
	sessionId: "session-1",
	shoppedAt: "2026-06-01T10:00:00.000Z",
	totalPrice: 8.5,
	createdAt: "2026-06-01T10:05:00.000Z",
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
};

describe("TicketDetail", () => {
	it("should call onDeleteRequest when delete button is clicked", () => {
		const onDeleteRequest = vi.fn();

		render(
			<TicketDetail
				entry={entry}
				isMobile={false}
				dateFormatter={dateFormatter}
				breakdownCalculator={breakdownCalculator}
				onDeleteRequest={onDeleteRequest}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

		expect(onDeleteRequest).toHaveBeenCalledWith("session-1");
	});
});
