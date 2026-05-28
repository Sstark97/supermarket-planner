import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { SearchProductsUseCase } from "../application/use-cases/search/SearchProductsUseCase";

const searchQuerySchema = z.object({
	q: z.string().max(100).optional(),
	category: z.string().optional(),
	supermarket: z.string().optional(),
	sortBy: z.enum(["price_asc", "price_desc"]).optional(),
});

export class SearchController {
	constructor(private readonly searchProductsUseCase: SearchProductsUseCase) {}

	search = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		const parseResult = searchQuerySchema.safeParse(req.query);

		if (!parseResult.success) {
			res.status(400).json({
				error: "Invalid query",
				details: parseResult.error.flatten().fieldErrors,
			});
			return;
		}

		try {
			const { q, category, supermarket, sortBy } = parseResult.data;
			const result = await this.searchProductsUseCase.searchFromDatabase(
				q,
				category,
				supermarket,
				sortBy,
			);

			const shouldRequestRefresh =
				Boolean(q?.trim()) && result.needsBackgroundRefresh;
			const refreshTriggered = shouldRequestRefresh
				? this.searchProductsUseCase.requestBackgroundRefresh(q!.trim())
				: false;

			const { needsBackgroundRefresh, refreshReason, ...publicResult } = result;
			res.json({
				...publicResult,
				...(refreshTriggered
					? {
							isRefreshing: true,
							refreshReason,
						}
					: {}),
			});
		} catch (error) {
			next(error);
		}
	};
}
