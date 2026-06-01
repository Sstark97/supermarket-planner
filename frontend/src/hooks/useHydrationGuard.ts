"use client";

import { useSyncExternalStore } from "react";

interface HydrationGuard {
	isMounted: boolean;
}

function subscribeToClientMount(): () => void {
	// This subscription is a no-op: the client snapshot is always stable after
	// the first render. The change notification is never needed after mount.
	return () => {};
}

function getClientSnapshot(): boolean {
	return true;
}

function getServerSnapshot(): boolean {
	return false;
}

export function useHydrationGuard(): HydrationGuard {
	const isMounted = useSyncExternalStore(
		subscribeToClientMount,
		getClientSnapshot,
		getServerSnapshot,
	);

	return { isMounted };
}
