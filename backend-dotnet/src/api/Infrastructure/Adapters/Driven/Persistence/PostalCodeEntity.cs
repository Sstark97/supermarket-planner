namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class PostalCodeEntity
{
    public string Code { get; set; } = string.Empty;
    public string ZoneId { get; set; } = string.Empty;

    public PricingZoneEntity Zone { get; set; } = null!;
}
