namespace SupermarketPlanner.Api.Application.UseCases.Categorization;

public sealed record CategorizePendingProductsResult(
    int TotalPending,
    int Categorized,
    int Failed);
