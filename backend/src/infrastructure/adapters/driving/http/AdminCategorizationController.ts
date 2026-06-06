import type { Request, Response, NextFunction } from "express";
import type { CategorizePendingProductsUseCase } from "@application/use-cases/categorization/CategorizePendingProductsUseCase";

export class AdminCategorizationController {
	constructor(
		private readonly categorizePendingProductsUseCase: CategorizePendingProductsUseCase,
	) {}

	categorizePending = async (
		_request: Request,
		response: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const result = await this.categorizePendingProductsUseCase.execute();
			response.json(result);
		} catch (error) {
			next(error);
		}
	};
}
