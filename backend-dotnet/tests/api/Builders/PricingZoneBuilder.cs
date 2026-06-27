using SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence;

namespace SupermarketPlanner.Api.Tests.Builders;

public sealed class PricingZoneBuilder
{
    private string zoneId = "zone-las-palmas";
    private string zoneName = "Las Palmas de Gran Canaria";

    public PricingZoneBuilder WithZoneId(string id)
    {
        zoneId = id;
        return this;
    }

    public PricingZoneBuilder WithZoneName(string name)
    {
        zoneName = name;
        return this;
    }

    public (PricingZoneEntity Zone, PostalCodeEntity PostalCode) Build(string postalCode)
    {
        var zone = new PricingZoneEntity
        {
            Id = zoneId,
            Name = zoneName
        };

        var postalCodeEntity = new PostalCodeEntity
        {
            Code = postalCode,
            ZoneId = zoneId
        };

        return (zone, postalCodeEntity);
    }
}
