import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShoppingHistoryViewTabs } from "./ShoppingHistoryViewTabs";

describe("ShoppingHistoryViewTabs", () => {
	it("should mark history tab as selected", () => {
		render(
			<ShoppingHistoryViewTabs activeView="history" onViewChange={vi.fn()} />,
		);

		expect(screen.getByRole("tab", { name: "Historial" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("should call onViewChange when switching tabs", () => {
		const onViewChange = vi.fn();
		render(
			<ShoppingHistoryViewTabs
				activeView="history"
				onViewChange={onViewChange}
			/>,
		);

		fireEvent.click(screen.getByRole("tab", { name: "Insights" }));

		expect(onViewChange).toHaveBeenCalledWith("insights");
	});
});
