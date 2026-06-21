namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ShoppingSessionItemEntity
{
    public string Id { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Supermarket { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Price { get; set; }
    public double PricePerUnit { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string TaxType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Image { get; set; }
    public string? Url { get; set; }

    public ShoppingSessionEntity Session { get; set; } = null!;
}
