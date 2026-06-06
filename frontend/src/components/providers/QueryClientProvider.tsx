"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const THIRTY_SECONDS_IN_MS = 30_000;

interface AppQueryClientProviderProps {
	children: React.ReactNode;
}

export function AppQueryClientProvider({
	children,
}: AppQueryClientProviderProps): React.ReactElement {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: THIRTY_SECONDS_IN_MS,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
