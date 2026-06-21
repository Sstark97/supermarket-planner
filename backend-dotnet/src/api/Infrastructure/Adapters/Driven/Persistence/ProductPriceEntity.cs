namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class ProductPriceEntity
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ZoneId { get; set; } = string.Empty;
    public double Price { get; set; }
    public double PricePerUnit { get; set; }
    public DateTime ScrapedAt { get; set; }

    public ProductEntity Product { get; set; } = null!;
    public PricingZoneEntity Zone { get; set; } = null!;
}
