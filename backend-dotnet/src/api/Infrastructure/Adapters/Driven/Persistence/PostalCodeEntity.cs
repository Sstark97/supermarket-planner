namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

public sealed class PostalCodeEntity
{
    public string Code { get; init; } = string.Empty;
    public string ZoneId { get; init; } = string.Empty;

    public PricingZoneEntity? Zone { get; init; }
}
