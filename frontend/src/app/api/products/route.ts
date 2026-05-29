import { ProductSearchFiltersMapper } from "@/features/product-search/filters";
import { NextRequest, NextResponse } from "next/server";

function buildBackendSearchUrl(searchParams: URLSearchParams): string {
	const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	return `${backendUrl}/search?${searchParams.toString()}`;
}

export async function GET(request: NextRequest) {
	const searchFiltersMapper = new ProductSearchFiltersMapper();
	const filters = searchFiltersMapper.parse(request.nextUrl.searchParams);
	const params = searchFiltersMapper.toSearchParams(filters);

	try {
		const res = await fetch(buildBackendSearchUrl(params), {
			cache: "no-store",
		});

		if (!res.ok) {
			if (res.status === 400 && !filters.query) {
				return NextResponse.json({ results: [] });
			}

			return NextResponse.json({
				results: [],
				error: `Backend API error: ${res.status}`,
			});
		}

		const json = await res.json();
		return NextResponse.json({
			results: Array.isArray(json?.results) ? json.results : [],
		});
	} catch (error) {
		console.error("[api/products] fetch failed", error);
		return NextResponse.json({
			results: [],
			error: "Backend unavailable",
		});
	}
}
