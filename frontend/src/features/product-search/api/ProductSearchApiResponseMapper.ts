import { NextResponse } from "next/server";

export class ProductSearchApiResponseMapper {
	toSuccess(payload: unknown) {
		const json = payload as { results?: unknown[] };
		return NextResponse.json({
			results: Array.isArray(json?.results) ? json.results : [],
		});
	}

	toBackendFailure(status: number, body?: string) {
		return NextResponse.json(
			{
				error: `Backend API error: ${status}`,
				details: body,
			},
			{ status: 500 },
		);
	}

	toUnavailable(error: unknown) {
		console.error("[api/products] fetch failed", error);
		return NextResponse.json(
			{
				error: "Backend unavailable",
			},
			{ status: 500 },
		);
	}
}
