namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ShoppingSessionItemEntity
{
    public string Id { get; init; } = string.Empty;
    public string SessionId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Supermarket { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public double Price { get; init; }
    public double PricePerUnit { get; init; }
    public string Unit { get; init; } = string.Empty;
    public string TaxType { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public string? Image { get; init; }
    public string? Url { get; init; }

    public ShoppingSessionEntity? Session { get; set; }
}
