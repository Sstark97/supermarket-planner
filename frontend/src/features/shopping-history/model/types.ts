import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";

export type ViewMode = "list" | "detail";

export interface MonthGroup {
	monthKey: string;
	monthLabel: string;
	entries: ShoppingSessionHistoryEntry[];
}

export interface YearGroup {
	yearKey: string;
	yearLabel: string;
	months: MonthGroup[];
}
