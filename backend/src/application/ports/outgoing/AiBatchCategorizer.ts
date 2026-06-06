export interface AiBatchCategorizer {
	categorizeBatch(productNames: string[]): Promise<Map<string, string>>;
}
