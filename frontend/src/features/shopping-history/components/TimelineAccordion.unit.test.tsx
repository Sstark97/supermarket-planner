import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelineAccordion } from "./TimelineAccordion";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
import type { YearGroup } from "@/features/shopping-history/model/ShoppingHistoryContracts";
import { ShoppingHistoryDateFormatter } from "@/features/shopping-history/model/ShoppingHistoryDateFormatter";
import { ShoppingHistoryBreakdownCalculator } from "@/features/shopping-history/model/ShoppingHistoryBreakdownCalculator";

function buildEntry(
	sessionId: string,
	totalPrice: number,
): ShoppingSessionHistoryEntry {
	return {
		sessionId,
		shoppedAt: "2026-01-15T10:00:00.000Z",
		totalPrice,
		createdAt: "2026-01-15T10:00:00.000Z",
		items: [
			{
				productName: "Leche",
				supermarket: "mercadona",
				category: "lacteos",
				price: 1.2,
				pricePerUnit: 1.2,
				unit: "L",
				taxType: "general",
				quantity: 2,
			},
		],
	};
}

function buildGroups(): YearGroup[] {
	return [
		{
			yearKey: "2026",
			yearLabel: "2026",
			months: [
				{
					monthKey: "2026-01",
					monthLabel: "Enero 2026",
					entries: [
						buildEntry("session-selected", 23.45),
						buildEntry("session-other", 11.1),
					],
				},
			],
		},
	];
}

describe("TimelineAccordion", () => {
	const dateFormatter = new ShoppingHistoryDateFormatter();
	const breakdownCalculator = new ShoppingHistoryBreakdownCalculator();

	function renderAccordion(selectedSessionId: string | null) {
		return render(
			<TimelineAccordion
				groups={buildGroups()}
				selectedSessionId={selectedSessionId}
				onSelectSession={vi.fn()}
				openYearKeys={["2026"]}
				onToggleYear={vi.fn()}
				openMonthKeys={["2026-01"]}
				onToggleMonth={vi.fn()}
				dateFormatter={dateFormatter}
				breakdownCalculator={breakdownCalculator}
			/>,
		);
	}

	it("should apply the kilox cyan left-border accent and a clean light background to the selected entry row", () => {
		renderAccordion("session-selected");

		const selectedRow = screen.getByText("23.45€").closest("button");
		expect(selectedRow?.className).toContain("border-l-kilox-cyan");
		expect(selectedRow?.className).toContain("border-l-4");
		expect(selectedRow?.className).toContain("bg-slate-50");
		expect(selectedRow?.className).toContain("text-slate-900");
	});

	it("should use kilox-sapphire tinted secondary text on the selected entry row", () => {
		renderAccordion("session-selected");

		const selectedRow = screen.getByText("23.45€").closest("button");
		const secondaryText = within(selectedRow as HTMLElement).getByText(/uds$/);
		expect(secondaryText.className).toContain("text-kilox-sapphire");
	});

	it("should keep a transparent left border on non-selected rows to avoid layout shift", () => {
		renderAccordion("session-selected");

		const nonSelectedRow = screen.getByText("11.10€").closest("button");
		expect(nonSelectedRow?.className).toContain("border-l-transparent");
		expect(nonSelectedRow?.className).toContain("border-l-4");
		expect(nonSelectedRow?.className).not.toContain("bg-slate-50");
	});

	it("should call onSelectSession when a row is clicked", () => {
		const onSelectSession = vi.fn();
		render(
			<TimelineAccordion
				groups={buildGroups()}
				selectedSessionId={null}
				onSelectSession={onSelectSession}
				openYearKeys={["2026"]}
				onToggleYear={vi.fn()}
				openMonthKeys={["2026-01"]}
				onToggleMonth={vi.fn()}
				dateFormatter={dateFormatter}
				breakdownCalculator={breakdownCalculator}
			/>,
		);

		const firstRow = screen.getByText("23.45€").closest("button");
		fireEvent.click(firstRow as HTMLButtonElement);

		expect(onSelectSession).toHaveBeenCalledWith("session-selected");
	});
});
