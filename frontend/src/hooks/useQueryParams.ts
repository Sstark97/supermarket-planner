"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type QueryParamValue = string | null | undefined;
type QueryParamUpdates = Record<string, QueryParamValue>;

export function useQueryParams() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const mergeParams = useCallback(
		(updates: QueryParamUpdates): URLSearchParams => {
			const params = new URLSearchParams(searchParams.toString());

			for (const [key, rawValue] of Object.entries(updates)) {
				const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

				if (!value) {
					params.delete(key);
					continue;
				}

				params.set(key, value);
			}

			return params;
		},
		[searchParams],
	);

	const buildMergedHref = useCallback(
		(updates: QueryParamUpdates): string => {
			const merged = mergeParams(updates);
			const query = merged.toString();
			return query ? `${pathname}?${query}` : pathname;
		},
		[mergeParams, pathname],
	);

	return {
		searchParams,
		mergeParams,
		buildMergedHref,
	};
}
