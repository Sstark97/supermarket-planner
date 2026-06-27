namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ProductPriceEntity
{
    public string Id { get; init; } = string.Empty;
    public string ProductId { get; init; } = string.Empty;
    public string ZoneId { get; init; } = string.Empty;
    public double Price { get; init; }
    public double PricePerUnit { get; init; }
    public DateTime ScrapedAt { get; init; }

    public ProductEntity? Product { get; init; }
    public PricingZoneEntity? Zone { get; init; }
}
