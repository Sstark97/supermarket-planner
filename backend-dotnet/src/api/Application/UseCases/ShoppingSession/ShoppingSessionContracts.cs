using SupermarketPlanner.Api.Application.Ports.Driven;

namespace SupermarketPlanner.Api.Application.UseCases.ShoppingSession;

public sealed record SaveShoppingSessionItemInput(
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

public sealed record SaveShoppingSessionInput(
    string UserId,
    string ShoppedAt,
    IReadOnlyList<SaveShoppingSessionItemInput> Items);

public sealed record SaveShoppingSessionResult(
    string SessionId,
    double TotalPrice,
    int ItemCount);

public sealed record GetShoppingSessionsInput(
    string UserId);

public sealed record ShoppingSessionHistoryItem(
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

public sealed record ShoppingSessionHistoryEntry(
    string SessionId,
    string ShoppedAt,
    double TotalPrice,
    string CreatedAt,
    IReadOnlyList<ShoppingSessionHistoryItem> Items);

public sealed record GetShoppingSessionsResult(
    IReadOnlyList<ShoppingSessionHistoryEntry> Sessions);

public sealed record DeleteShoppingSessionInput(
    string SessionId,
    string UserId);

public sealed record DeleteShoppingSessionResult(
    bool Deleted);

public sealed record GetShoppingSessionMetricsInput(
    string UserId);

public sealed record GetShoppingSessionMetricsResult(
    IReadOnlyList<ShoppingSessionSupermarketDominanceMetric> SupermarketDominance,
    ShoppingSessionSpendingTrends SpendingTrends,
    ShoppingSessionTicketMetrics TicketMetrics);
