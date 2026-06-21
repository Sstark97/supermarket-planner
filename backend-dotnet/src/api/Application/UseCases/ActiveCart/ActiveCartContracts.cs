namespace SupermarketPlanner.Api.Application.UseCases.ActiveCart;

public sealed record MergeCartItemInput(
    string ProductId,
    string ProductName,
    string Supermarket,
    string Category,
    double Price,
    double PricePerUnit,
    string Unit,
    string TaxType,
    int Quantity,
    string? Image,
    string? Url);

public sealed record MergeCartInput(
    string UserId,
    IReadOnlyList<MergeCartItemInput> Items);

public sealed record MergeCartResultItem(
    string ProductId,
    string ProductName,
    string Supermarket,
    string Category,
    double Price,
    double PricePerUnit,
    string Unit,
    string TaxType,
    int Quantity,
    string? Image,
    string? Url);

public sealed record MergeCartResult(
    string CartId,
    string UserId,
    int TotalItems,
    IReadOnlyList<MergeCartResultItem> Items);
