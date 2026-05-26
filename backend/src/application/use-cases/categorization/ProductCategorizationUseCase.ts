import { ProductCategory } from "../../../interfaces/IProduct";
import type { KeywordCategorizer } from "../../ports/outgoing/KeywordCategorizer";
import type { AiCategorizer } from "../../ports/outgoing/AiCategorizer";

export interface ProductCategorizationUseCaseDeps {
	keywordCategorizer: KeywordCategorizer;
	aiCategorizer?: AiCategorizer;
	aiTimeoutMs?: number;
	logger?: {
		error(message: string): void;
	};
}

export class ProductCategorizationUseCase {
	private readonly keywordCategorizer: KeywordCategorizer;
	private readonly aiCategorizer?: AiCategorizer;
	private readonly aiTimeoutMs: number;
	private readonly logger?: { error(message: string): void };

	constructor(deps: ProductCategorizationUseCaseDeps) {
		this.keywordCategorizer = deps.keywordCategorizer;
		this.aiCategorizer = deps.aiCategorizer;
		this.aiTimeoutMs = deps.aiTimeoutMs ?? 1500;
		this.logger = deps.logger;
	}

	async execute(productName: string): Promise<ProductCategory> {
		const keywordCategory = this.keywordCategorizer.match(productName);
		if (keywordCategory) {
			return keywordCategory;
		}

		if (!this.aiCategorizer) {
			return ProductCategory.OTHER;
		}

		try {
			const aiCategory = await this.withTimeout(
				this.aiCategorizer.categorize(productName),
				this.aiTimeoutMs,
			);
			return aiCategory ?? ProductCategory.OTHER;
		} catch (error) {
			this.logger?.error(
				`[ProductCategorizationUseCase] AI fallback failed: ${String(error)}`,
			);
			return ProductCategory.OTHER;
		}
	}

	private async withTimeout<T>(
		promise: Promise<T>,
		timeoutMs: number,
	): Promise<T> {
		let timer: NodeJS.Timeout | undefined;

		try {
			return await Promise.race([
				promise,
				new Promise<T>((_resolve, reject) => {
					timer = setTimeout(() => {
						reject(new Error(`AI categorization timeout after ${timeoutMs}ms`));
					}, timeoutMs);
				}),
			]);
		} finally {
			if (timer) {
				clearTimeout(timer);
			}
		}
	}
}
