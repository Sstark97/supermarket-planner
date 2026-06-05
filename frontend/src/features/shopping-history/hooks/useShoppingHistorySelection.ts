import { useState } from "react";
import type { ShoppingSessionHistoryEntry } from "@/lib/http/ShoppingSessionGateway";
type ViewMode = "list" | "detail";

export interface ShoppingHistorySelectionState {
	selectedSessionId: string | null;
	selectedEntry: ShoppingSessionHistoryEntry | null;
	mobileViewMode: ViewMode;
	handleSelectSession: (sessionId: string) => void;
	setSelectedSessionId: (sessionId: string | null) => void;
	setMobileViewMode: (mode: ViewMode) => void;
}

export function useShoppingHistorySelection(
	filteredEntries: ShoppingSessionHistoryEntry[],
): ShoppingHistorySelectionState {
	const [requestedSessionId, setRequestedSessionId] = useState<string | null>(
		null,
	);
	const [requestedMobileViewMode, setRequestedMobileViewMode] =
		useState<ViewMode>("list");

	const hasRequestedSession = filteredEntries.some(
		(entry) => entry.sessionId === requestedSessionId,
	);
	const selectedSessionId = hasRequestedSession
		? requestedSessionId
		: (filteredEntries[0]?.sessionId ?? null);
	const selectedEntry =
		filteredEntries.find((entry) => entry.sessionId === selectedSessionId) ??
		null;
	const mobileViewMode =
		filteredEntries.length === 0 ? "list" : requestedMobileViewMode;

	function handleSelectSession(sessionId: string): void {
		setRequestedSessionId(sessionId);
		setRequestedMobileViewMode("detail");
	}

	function setSelectedSessionId(sessionId: string | null): void {
		setRequestedSessionId(sessionId);
	}

	function setMobileViewMode(mode: ViewMode): void {
		setRequestedMobileViewMode(mode);
	}

	return {
		selectedSessionId,
		selectedEntry,
		mobileViewMode,
		handleSelectSession,
		setSelectedSessionId,
		setMobileViewMode,
	};
}
