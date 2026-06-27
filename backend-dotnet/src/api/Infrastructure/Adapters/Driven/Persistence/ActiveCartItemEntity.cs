namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ActiveCartItemEntity
{
    public string Id { get; init; } = string.Empty;
    public string CartId { get; init; } = string.Empty;
    public string ProductId { get; init; } = string.Empty;
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
    public ActiveCartEntity? Cart { get; init; }
}
