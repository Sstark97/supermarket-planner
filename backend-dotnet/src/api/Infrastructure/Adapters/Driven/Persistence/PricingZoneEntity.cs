namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class PricingZoneEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public ICollection<ProductPriceEntity> Prices { get; set; } = [];
    public ICollection<PostalCodeEntity> PostalCodes { get; set; } = [];
}
