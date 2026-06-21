namespace SupermarketPlanner.Api.Domain.Entities;

public sealed record ShoppingSessionEntity(
    string Id,
    string UserId,
    DateTimeOffset ShoppedAt,
    double TotalPrice,
    DateTimeOffset CreatedAt,
    IReadOnlyList<ShoppingSessionItem> Items);
