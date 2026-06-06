import { NextResponse } from "next/server";

type PaginatedPayload = {
	results?: unknown[];
	nextCursor?: string | null;
	totalCount?: number;
};

export class ProductSearchApiResponseMapper {
	toSuccess(payload: unknown): NextResponse {
		const json = payload as PaginatedPayload;
		return NextResponse.json({
			results: Array.isArray(json?.results) ? json.results : [],
			nextCursor: json?.nextCursor ?? null,
			totalCount: typeof json?.totalCount === "number" ? json.totalCount : 0,
		});
	}

	toBackendFailure(status: number, body?: string): NextResponse {
		return NextResponse.json(
			{
				error: `Backend API error: ${status}`,
				details: body,
			},
			{ status: 500 },
		);
	}

	toUnavailable(error: unknown): NextResponse {
		console.error("[api/products] fetch failed", error);
		return NextResponse.json(
			{
				error: "Backend unavailable",
			},
			{ status: 500 },
		);
	}
}
