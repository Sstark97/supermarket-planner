using SupermarketPlanner.Api.Application.DTOs;

namespace SupermarketPlanner.Api.Infrastructure.Adapters.Driven.Persistence.Mappers;

public static class ProductEntityMapper
{
    public static ProductDto ToDto(ProductEntity entity, ProductPriceEntity priceInZone) =>
        new(
            Id: entity.Id,
            Name: entity.Name,
            Supermarket: entity.Supermarket,
            Category: entity.Category,
            Price: priceInZone.Price,
            PricePerUnit: priceInZone.PricePerUnit,
            Unit: entity.Unit,
            Image: entity.Image,
            Url: entity.Url,
            TaxType: entity.TaxType,
            ScrapedAt: new DateTimeOffset(priceInZone.ScrapedAt, TimeSpan.Zero));
}
